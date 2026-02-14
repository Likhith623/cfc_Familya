"""Family Rooms router - Group chats & cultural potlucks."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from models.schemas import CreateRoomRequest, InviteToRoomRequest, RoomMessageRequest, CreatePotluckRequest
from services.supabase_client import get_supabase
from services.translation_service import translate_text
from services.auth_service import get_current_user_id, get_optional_user_id

router = APIRouter(prefix="/rooms", tags=["Family Rooms"])


@router.post("/create")
async def create_room(req: CreateRoomRequest, user_id: str = Depends(get_current_user_id)):
    """Create a new Global Family Room."""
    db = get_supabase()
    
    # Check if user has reached Level 5 in at least one relationship
    rels = db.table("relationships") \
        .select("level") \
        .or_(f"user_a_id.eq.{user_id},user_b_id.eq.{user_id}") \
        .gte("level", 5) \
        .execute()
    
    # For demo purposes, allow room creation
    room = db.table("family_rooms").insert({
        "room_name": req.room_name,
        "description": req.description,
        "room_type": req.room_type,
        "max_members": req.max_members,
        "created_by": user_id,
        "next_host_id": user_id
    }).execute()
    
    if not room.data:
        raise HTTPException(status_code=500, detail="Failed to create room")
    
    room_data = room.data[0]
    
    # Add creator as first member
    db.table("family_room_members").insert({
        "room_id": room_data["id"],
        "user_id": user_id,
        "role_in_room": "mother",  # Default, can be changed
        "is_moderator": True
    }).execute()
    
    return {"room": room_data}


@router.get("/")
async def get_user_rooms(user_id: str = Depends(get_current_user_id)):
    """Get all rooms the user is a member of."""
    db = get_supabase()
    
    memberships = db.table("family_room_members") \
        .select("*, family_rooms(*)") \
        .eq("user_id", user_id) \
        .eq("status", "active") \
        .execute()
    
    rooms = []
    for m in (memberships.data or []):
        room = m.get("family_rooms", {})
        if not room:
            continue
        # Get member count
        members = db.table("family_room_members") \
            .select("user_id, role_in_room, profiles(display_name, country, avatar_config)") \
            .eq("room_id", room.get("id", "")) \
            .eq("status", "active") \
            .execute()
        
        rooms.append({
            **room,
            "my_role": m["role_in_room"],
            "is_moderator": m["is_moderator"],
            "members": members.data or [],
            "member_count": len(members.data or [])
        })
    
    return {"rooms": rooms}


@router.post("/{room_id}/invite")
async def invite_to_room(room_id: str, req: InviteToRoomRequest, user_id: str = Depends(get_current_user_id)):
    """Invite a user to a family room."""
    db = get_supabase()
    
    # Check if inviter is a member/moderator
    membership = db.table("family_room_members") \
        .select("*") \
        .eq("room_id", room_id) \
        .eq("user_id", user_id) \
        .eq("status", "active") \
        .execute()
    
    if not membership.data or len(membership.data) == 0:
        raise HTTPException(status_code=403, detail="You are not a member of this room")
    
    # Check room capacity
    room = db.table("family_rooms").select("max_members").eq("id", room_id).execute()
    current_members = db.table("family_room_members") \
        .select("id", count="exact") \
        .eq("room_id", room_id) \
        .eq("status", "active") \
        .execute()
    
    room_data = room.data[0] if room.data else {"max_members": 8}
    if current_members.count >= room_data.get("max_members", 8):
        raise HTTPException(status_code=400, detail="Room is full")
    
    # Parent roles get moderator powers
    is_moderator = req.role_in_room in ["mother", "father", "grandparent"]
    
    # Add member
    member = db.table("family_room_members").insert({
        "room_id": room_id,
        "user_id": req.user_id,
        "role_in_room": req.role_in_room,
        "is_moderator": is_moderator
    }).execute()
    
    # Notify invited user
    db.table("notifications").insert({
        "user_id": req.user_id,
        "type": "family_room_invite",
        "title": "🏠 You've been invited to a Family Room!",
        "body": "Join your digital family and share cultures together.",
        "data": {"room_id": room_id}
    }).execute()
    
    return {"member": member.data[0] if member.data else None}


@router.post("/{room_id}/message")
async def send_room_message(room_id: str, req: RoomMessageRequest, user_id: str = Depends(get_current_user_id)):
    """Send a message to a family room with multi-language translation."""
    db = get_supabase()
    
    # Get all members' primary languages
    members = db.table("family_room_members") \
        .select("user_id") \
        .eq("room_id", room_id) \
        .eq("status", "active") \
        .execute()
    
    member_ids = [m["user_id"] for m in (members.data or [])]
    
    # Get unique languages
    languages = db.table("user_languages") \
        .select("language_code, user_id") \
        .in_("user_id", member_ids) \
        .eq("is_primary", True) \
        .execute()
    
    unique_langs = set(l["language_code"] for l in (languages.data or []))
    source_lang = req.original_language or "en"
    
    # Translate to all languages
    translations = {}
    for lang in unique_langs:
        if lang != source_lang:
            result = await translate_text(req.original_text, source_lang, lang)
            translations[lang] = result["translated_text"]
    translations[source_lang] = req.original_text
    
    # Save message
    message = db.table("family_room_messages").insert({
        "room_id": room_id,
        "sender_id": user_id,
        "content_type": req.content_type,
        "original_text": req.original_text,
        "original_language": source_lang,
        "translations": translations
    }).execute()
    
    return {"message": message.data[0] if message.data else None}


@router.get("/{room_id}/messages")
async def get_room_messages(room_id: str, limit: int = 50, user_id: str = Depends(get_current_user_id)):
    """Get messages for a family room."""
    db = get_supabase()
    
    messages = db.table("family_room_messages") \
        .select("*, profiles:sender_id(display_name, avatar_config, country)") \
        .eq("room_id", room_id) \
        .eq("is_deleted", False) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    
    return {"messages": list(reversed(messages.data or []))}


@router.post("/{room_id}/leave")
async def leave_room(room_id: str, user_id: str = Depends(get_current_user_id)):
    """Initiate leaving a family room (7-day farewell period)."""
    db = get_supabase()
    
    db.table("family_room_members").update({
        "status": "leaving",
        "leaving_announced_at": datetime.utcnow().isoformat()
    }).eq("room_id", room_id).eq("user_id", user_id).execute()
    
    # Check remaining members
    remaining = db.table("family_room_members") \
        .select("id", count="exact") \
        .eq("room_id", room_id) \
        .in_("status", ["active"]) \
        .execute()
    
    if remaining.count <= 1:
        # Auto-dissolve room
        db.table("family_rooms").update({"is_active": False}).eq("id", room_id).execute()
        return {"status": "room_dissolved", "message": "Room has been dissolved as not enough members remain."}
    
    return {
        "status": "leaving_announced",
        "farewell_period": "7 days",
        "message": "Your family has been notified. You have 7 days for goodbyes."
    }


# ── Cultural Potluck ──────────────────────────────────

@router.post("/{room_id}/potluck")
async def create_potluck(room_id: str, req: CreatePotluckRequest, user_id: str = Depends(get_current_user_id)):
    """Create a cultural potluck event."""
    db = get_supabase()
    
    potluck = db.table("cultural_potlucks").insert({
        "room_id": room_id,
        "host_id": user_id,
        "theme": req.theme,
        "dish_name": req.dish_name,
        "cultural_significance": req.cultural_significance,
        "recipe": req.recipe,
        "country_of_origin": req.country_of_origin,
        "scheduled_at": req.scheduled_at,
        "status": "scheduled"
    }).execute()
    
    # Notify all room members
    members = db.table("family_room_members") \
        .select("user_id") \
        .eq("room_id", room_id) \
        .eq("status", "active") \
        .neq("user_id", user_id) \
        .execute()
    
    for member in (members.data or []):
        db.table("notifications").insert({
            "user_id": member["user_id"],
            "type": "potluck_reminder",
            "title": f"🍽️ Cultural Potluck: {req.theme}",
            "body": f"A new potluck event has been scheduled! Theme: {req.theme}",
            "data": {"room_id": room_id, "potluck_id": potluck.data[0]["id"] if potluck.data else None}
        }).execute()
    
    return {"potluck": potluck.data[0] if potluck.data else None}


@router.get("/{room_id}/potlucks")
async def get_potlucks(room_id: str, user_id: str = Depends(get_current_user_id)):
    """Get all potluck events for a room."""
    db = get_supabase()
    
    potlucks = db.table("cultural_potlucks") \
        .select("*, profiles:host_id(display_name, country, avatar_config)") \
        .eq("room_id", room_id) \
        .order("scheduled_at", desc=True) \
        .execute()
    
    return {
        "potlucks": potlucks.data or [],
        "suggested_themes": [
            "🍜 Comfort food from childhood",
            "🎉 Festival dishes",
            "🌮 Street food favorites",
            "👵 Grandma's recipe",
            "🌅 Breakfast around the world",
            "🍰 Sweet treats & desserts",
            "🥗 Healthy family meals",
            "🔥 Spiciest dish you can handle"
        ]
    }
