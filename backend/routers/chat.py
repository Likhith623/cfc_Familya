"""Chat router - Messages with real-time translation."""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from datetime import datetime
from typing import Dict, Set
import json

from models.schemas import SendMessageRequest
from services.supabase_client import get_supabase
from services.translation_service import translate_text, extract_facts_from_message, detect_language

router = APIRouter(prefix="/chat", tags=["Chat"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, relationship_id: str):
        await websocket.accept()
        if relationship_id not in self.active_connections:
            self.active_connections[relationship_id] = set()
        self.active_connections[relationship_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, relationship_id: str):
        if relationship_id in self.active_connections:
            self.active_connections[relationship_id].discard(websocket)
    
    async def broadcast(self, relationship_id: str, message: dict, exclude: WebSocket = None):
        if relationship_id in self.active_connections:
            for connection in self.active_connections[relationship_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

manager = ConnectionManager()


@router.post("/send")
async def send_message(req: SendMessageRequest, user_id: str = ""):
    """Send a message with auto-translation."""
    db = get_supabase()
    
    # Verify relationship exists and is active
    rel = db.table("relationships") \
        .select("*") \
        .eq("id", req.relationship_id) \
        .eq("status", "active") \
        .execute()
    
    if not rel.data or len(rel.data) == 0:
        raise HTTPException(status_code=404, detail="Relationship not found or inactive")
    
    rel_data = rel.data[0]
    
    # Determine partner
    is_user_a = user_id == rel_data["user_a_id"]
    partner_id = rel_data["user_b_id"] if is_user_a else rel_data["user_a_id"]
    
    # Detect language if not provided
    source_lang = req.original_language
    if not source_lang:
        source_lang = await detect_language(req.original_text)
    
    # Get partner's primary language
    partner_lang = db.table("user_languages") \
        .select("language_code") \
        .eq("user_id", partner_id) \
        .eq("is_primary", True) \
        .limit(1) \
        .execute()
    
    target_lang = partner_lang.data[0]["language_code"] if partner_lang.data else "en"
    
    # Translate
    translation = await translate_text(req.original_text, source_lang, target_lang)
    
    # Extract facts for future contests
    facts = await extract_facts_from_message(req.original_text, user_id)
    
    # Save message
    message = db.table("messages").insert({
        "relationship_id": req.relationship_id,
        "sender_id": user_id,
        "content_type": req.content_type,
        "original_text": req.original_text,
        "original_language": source_lang,
        "translated_text": translation["translated_text"],
        "target_language": target_lang,
        "has_idiom": translation["has_idiom"],
        "idiom_explanation": translation["idiom_explanation"],
        "cultural_note": translation["cultural_note"],
        "voice_url": req.voice_url,
        "image_url": req.image_url,
        "extracted_facts": [{"fact": f["category"], "value": f["value"]} for f in facts] if facts else []
    }).execute()
    
    if not message.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    
    msg_data = message.data[0]
    
    # Save extracted facts
    for fact in facts:
        db.table("chat_facts").insert({
            "user_id": user_id,
            "relationship_id": req.relationship_id,
            "source_message_id": msg_data["id"],
            "fact_category": fact["category"],
            "fact_value": fact["value"],
            "confidence": 0.85
        }).execute()
    
    # Send notification to partner
    sender_profile = db.table("profiles").select("display_name").eq("id", user_id).execute()
    sender_name = sender_profile.data[0]["display_name"] if sender_profile.data else "Someone"
    
    db.table("notifications").insert({
        "user_id": partner_id,
        "type": "new_message",
        "title": f"💬 New message from {sender_name}",
        "body": translation["translated_text"][:100],
        "data": {"relationship_id": req.relationship_id, "message_id": msg_data["id"]}
    }).execute()
    
    # Broadcast via WebSocket
    await manager.broadcast(req.relationship_id, {
        "type": "new_message",
        "message": msg_data
    })
    
    return {"message": msg_data}


@router.get("/messages/{relationship_id}")
async def get_messages(relationship_id: str, limit: int = 50, offset: int = 0, user_id: str = ""):
    """Get messages for a relationship."""
    db = get_supabase()
    
    messages = db.table("messages") \
        .select("*") \
        .eq("relationship_id", relationship_id) \
        .eq("is_deleted", False) \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    # Mark unread messages as read
    if user_id:
        db.table("messages") \
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()}) \
            .eq("relationship_id", relationship_id) \
            .neq("sender_id", user_id) \
            .eq("is_read", False) \
            .execute()
    
    return {"messages": list(reversed(messages.data or []))}


@router.get("/relationship/{relationship_id}")
async def get_relationship_details(relationship_id: str, user_id: str = ""):
    """Get full relationship details including partner info."""
    db = get_supabase()
    
    rel = db.table("relationships").select("*").eq("id", relationship_id).execute()
    if not rel.data or len(rel.data) == 0:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    rel_data = rel.data[0]
    
    # Get partner profile
    partner_id = rel_data["user_b_id"] if rel_data["user_a_id"] == user_id else rel_data["user_a_id"]
    partner = db.table("profiles") \
        .select("id, display_name, country, city, timezone, avatar_config, is_verified, care_score, status, status_message, last_active_at") \
        .eq("id", partner_id) \
        .execute()
    
    partner_data = partner.data[0] if partner.data else None
    
    # Get milestones
    milestones = db.table("relationship_milestones") \
        .select("*") \
        .eq("relationship_id", relationship_id) \
        .order("achieved_at", desc=True) \
        .execute()
    
    # Get partner's timezone for coordination
    partner_tz = partner_data.get("timezone", "UTC") if partner_data else "UTC"
    
    # Determine my role and partner's role
    my_role = rel_data["user_a_role"] if rel_data["user_a_id"] == user_id else rel_data["user_b_role"]
    partner_role = rel_data["user_b_role"] if rel_data["user_a_id"] == user_id else rel_data["user_a_role"]
    
    return {
        "relationship": rel_data,
        "partner": partner_data,
        "partner_timezone": partner_tz,
        "milestones": milestones.data or [],
        "my_role": my_role,
        "partner_role": partner_role,
        "features_unlocked": {
            "text": True,
            "emojis": rel.data["level"] >= 2,
            "audio_calls": rel.data["level"] >= 3,
            "video_calls": rel.data["level"] >= 4,
            "family_room": rel.data["level"] >= 5,
            "digital_heirloom": rel.data["level"] >= 10
        }
    }


@router.websocket("/ws/{relationship_id}/{user_id}")
async def websocket_chat(websocket: WebSocket, relationship_id: str, user_id: str):
    """WebSocket endpoint for real-time chat."""
    await manager.connect(websocket, relationship_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "typing":
                await manager.broadcast(relationship_id, {
                    "type": "typing",
                    "user_id": user_id
                }, exclude=websocket)
            
            elif message_data.get("type") == "message":
                # Process message through the send endpoint logic
                req = SendMessageRequest(
                    relationship_id=relationship_id,
                    original_text=message_data.get("text", ""),
                    content_type=message_data.get("content_type", "text"),
                    original_language=message_data.get("language")
                )
                result = await send_message(req, user_id=user_id)
                
                await manager.broadcast(relationship_id, {
                    "type": "new_message",
                    "message": result["message"]
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, relationship_id)
    except Exception:
        manager.disconnect(websocket, relationship_id)
