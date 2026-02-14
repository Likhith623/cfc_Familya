"""Chat router - Messages with real-time translation."""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from datetime import datetime
from typing import Dict, Set
import json

from models.schemas import SendMessageRequest
from services.supabase_client import get_supabase
from services.translation_service import translate_text, extract_facts_from_message, detect_language
from services.auth_service import get_current_user_id

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
async def send_message(req: SendMessageRequest, current_user: str = Depends(get_current_user_id)):
    """Send a message with auto-translation."""
    db = get_supabase()
    user_id = current_user
    
    # Verify relationship exists and is active
    rel = db.table("relationships") \
        .select("*") \
        .eq("id", req.relationship_id) \
        .eq("status", "active") \
        .execute()
    
    if not rel.data or len(rel.data) == 0:
        raise HTTPException(status_code=404, detail="Relationship not found or inactive")
    
    rel_data = rel.data[0]
    
    # Verify this user is part of the relationship
    if user_id not in [rel_data["user_a_id"], rel_data["user_b_id"]]:
        raise HTTPException(status_code=403, detail="You are not part of this relationship")
    
    # Determine partner
    is_user_a = user_id == rel_data["user_a_id"]
    partner_id = rel_data["user_b_id"] if is_user_a else rel_data["user_a_id"]
    
    # Detect language if not provided
    source_lang = req.original_language
    if not source_lang:
        try:
            source_lang = await detect_language(req.original_text)
        except Exception:
            source_lang = "en"
    
    # Get partner's primary language
    target_lang = "en"
    try:
        partner_lang = db.table("user_languages") \
            .select("language_code") \
            .eq("user_id", partner_id) \
            .eq("is_primary", True) \
            .limit(1) \
            .execute()
        if partner_lang.data:
            target_lang = partner_lang.data[0]["language_code"]
    except Exception:
        pass
    
    # Translate (with fallback)
    translation = {
        "translated_text": req.original_text,
        "has_idiom": False,
        "idiom_explanation": None,
        "cultural_note": None,
    }
    try:
        translation = await translate_text(req.original_text, source_lang, target_lang)
    except Exception as e:
        print(f"[Chat] Translation failed: {e}")
    
    # Extract facts for future contests (non-blocking)
    facts = []
    try:
        facts = await extract_facts_from_message(req.original_text, user_id)
    except Exception:
        pass
    
    # Save message
    message = db.table("messages").insert({
        "relationship_id": req.relationship_id,
        "sender_id": user_id,
        "content_type": req.content_type,
        "original_text": req.original_text,
        "original_language": source_lang,
        "translated_text": translation["translated_text"],
        "target_language": target_lang,
        "has_idiom": translation.get("has_idiom", False),
        "idiom_explanation": translation.get("idiom_explanation"),
        "cultural_note": translation.get("cultural_note"),
        "voice_url": req.voice_url,
        "image_url": req.image_url,
        "extracted_facts": [{"fact": f["category"], "value": f["value"]} for f in facts] if facts else []
    }).execute()
    
    if not message.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    
    msg_data = message.data[0]
    
    # Update relationship stats
    try:
        db.table("relationships").update({
            "messages_exchanged": rel_data.get("messages_exchanged", 0) + 1,
            "last_interaction_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", req.relationship_id).execute()
    except Exception:
        pass
    
    # Save extracted facts (non-blocking)
    for fact in facts:
        try:
            db.table("chat_facts").insert({
                "user_id": user_id,
                "relationship_id": req.relationship_id,
                "source_message_id": msg_data["id"],
                "fact_category": fact["category"],
                "fact_value": fact["value"],
                "confidence": 0.85
            }).execute()
        except Exception:
            pass
    
    # Send notification to partner (non-blocking)
    try:
        sender_profile = db.table("profiles").select("display_name").eq("id", user_id).execute()
        sender_name = sender_profile.data[0]["display_name"] if sender_profile.data else "Someone"
        
        db.table("notifications").insert({
            "user_id": partner_id,
            "type": "new_message",
            "title": f"💬 New message from {sender_name}",
            "body": (translation["translated_text"] or req.original_text)[:100],
            "data": {"relationship_id": req.relationship_id, "message_id": msg_data["id"]}
        }).execute()
    except Exception:
        pass
    
    # Broadcast via WebSocket
    try:
        await manager.broadcast(req.relationship_id, {
            "type": "new_message",
            "message": msg_data
        })
    except Exception:
        pass
    
    return {"message": msg_data}


@router.get("/messages/{relationship_id}")
async def get_messages(relationship_id: str, limit: int = 50, offset: int = 0, current_user: str = Depends(get_current_user_id)):
    """Get messages for a relationship."""
    db = get_supabase()
    
    # Verify user is part of this relationship
    rel = db.table("relationships").select("user_a_id, user_b_id").eq("id", relationship_id).execute()
    if not rel.data:
        raise HTTPException(status_code=404, detail="Relationship not found")
    rel_data = rel.data[0]
    if current_user not in [rel_data["user_a_id"], rel_data["user_b_id"]]:
        raise HTTPException(status_code=403, detail="You are not part of this relationship")
    
    messages = db.table("messages") \
        .select("*") \
        .eq("relationship_id", relationship_id) \
        .eq("is_deleted", False) \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    # Mark unread messages as read
    try:
        db.table("messages") \
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()}) \
            .eq("relationship_id", relationship_id) \
            .neq("sender_id", current_user) \
            .eq("is_read", False) \
            .execute()
    except Exception:
        pass
    
    return {"messages": list(reversed(messages.data or []))}


@router.get("/relationship/{relationship_id}")
async def get_relationship_details(relationship_id: str, current_user: str = Depends(get_current_user_id)):
    """Get full relationship details including partner info."""
    db = get_supabase()
    
    rel = db.table("relationships").select("*").eq("id", relationship_id).execute()
    if not rel.data or len(rel.data) == 0:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    rel_data = rel.data[0]
    
    # Verify user is part of this relationship
    if current_user not in [rel_data["user_a_id"], rel_data["user_b_id"]]:
        raise HTTPException(status_code=403, detail="You are not part of this relationship")
    
    # Get partner profile
    partner_id = rel_data["user_b_id"] if rel_data["user_a_id"] == current_user else rel_data["user_a_id"]
    partner = db.table("profiles") \
        .select("id, display_name, country, city, timezone, avatar_config, is_verified, care_score, status, status_message, last_active_at") \
        .eq("id", partner_id) \
        .execute()
    
    partner_data = partner.data[0] if partner.data else None
    
    # Get milestones (non-blocking)
    milestones_data = []
    try:
        milestones = db.table("relationship_milestones") \
            .select("*") \
            .eq("relationship_id", relationship_id) \
            .order("achieved_at", desc=True) \
            .execute()
        milestones_data = milestones.data or []
    except Exception:
        pass
    
    # Get partner's timezone for coordination
    partner_tz = partner_data.get("timezone", "UTC") if partner_data else "UTC"
    
    # Determine my role and partner's role
    my_role = rel_data["user_a_role"] if rel_data["user_a_id"] == current_user else rel_data["user_b_role"]
    partner_role = rel_data["user_b_role"] if rel_data["user_a_id"] == current_user else rel_data["user_a_role"]
    
    level = rel_data.get("level", 1)
    
    return {
        "relationship": rel_data,
        "partner": partner_data,
        "partner_timezone": partner_tz,
        "milestones": milestones_data,
        "my_role": my_role,
        "partner_role": partner_role,
        "features_unlocked": {
            "text": True,
            "emojis": level >= 2,
            "audio_calls": level >= 3,
            "video_calls": level >= 4,
            "family_room": level >= 5,
            "digital_heirloom": level >= 10
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
                # Process message via internal helper
                db = get_supabase()
                
                original_text = message_data.get("text", "")
                content_type = message_data.get("content_type", "text")
                original_language = message_data.get("language")
                
                # Get relationship
                rel = db.table("relationships").select("*").eq("id", relationship_id).eq("status", "active").execute()
                if not rel.data:
                    await websocket.send_json({"type": "error", "message": "Relationship not found"})
                    continue
                    
                rel_data = rel.data[0]
                is_user_a = user_id == rel_data["user_a_id"]
                partner_id = rel_data["user_b_id"] if is_user_a else rel_data["user_a_id"]
                
                # Detect language
                source_lang = original_language or "en"
                if not original_language:
                    try:
                        source_lang = await detect_language(original_text)
                    except Exception:
                        source_lang = "en"
                
                # Get target language
                target_lang = "en"
                try:
                    partner_lang = db.table("user_languages") \
                        .select("language_code") \
                        .eq("user_id", partner_id) \
                        .eq("is_primary", True) \
                        .limit(1) \
                        .execute()
                    if partner_lang.data:
                        target_lang = partner_lang.data[0]["language_code"]
                except Exception:
                    pass
                
                # Translate
                translation = {
                    "translated_text": original_text,
                    "has_idiom": False,
                    "idiom_explanation": None,
                    "cultural_note": None,
                }
                try:
                    translation = await translate_text(original_text, source_lang, target_lang)
                except Exception:
                    pass
                
                # Save message
                message = db.table("messages").insert({
                    "relationship_id": relationship_id,
                    "sender_id": user_id,
                    "content_type": content_type,
                    "original_text": original_text,
                    "original_language": source_lang,
                    "translated_text": translation["translated_text"],
                    "target_language": target_lang,
                    "has_idiom": translation.get("has_idiom", False),
                    "idiom_explanation": translation.get("idiom_explanation"),
                    "cultural_note": translation.get("cultural_note"),
                }).execute()
                
                if message.data:
                    await manager.broadcast(relationship_id, {
                        "type": "new_message",
                        "message": message.data[0]
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, relationship_id)
    except Exception:
        manager.disconnect(websocket, relationship_id)
