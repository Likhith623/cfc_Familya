"""Profile management router."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from models.schemas import ProfileUpdate, LanguageInput
from services.supabase_client import get_supabase

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/{user_id}")
async def get_profile(user_id: str):
    """Get a user's public profile."""
    db = get_supabase()
    
    profile = db.table("profiles") \
        .select("id, username, display_name, country, city, timezone, bio, voice_bio_url, profile_photo_url, avatar_config, is_verified, care_score, reliability_score, total_bond_points, status, created_at") \
        .eq("id", user_id) \
        .single() \
        .execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    languages = db.table("user_languages").select("*").eq("user_id", user_id).execute()
    
    # Get achievement count
    achievements = db.table("user_achievements") \
        .select("*, achievements(name, icon_emoji, rarity)") \
        .eq("user_id", user_id) \
        .execute()
    
    # Get active relationships count
    rels = db.table("relationships") \
        .select("id") \
        .or_(f"user_a_id.eq.{user_id},user_b_id.eq.{user_id}") \
        .eq("status", "active") \
        .execute()
    
    return {
        "profile": profile.data,
        "languages": languages.data or [],
        "achievements": achievements.data or [],
        "active_relationships": len(rels.data or [])
    }


@router.put("/{user_id}")
async def update_profile(user_id: str, update: ProfileUpdate):
    """Update user profile."""
    db = get_supabase()
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"profile": result.data[0]}


@router.put("/{user_id}/avatar")
async def update_avatar(user_id: str, avatar_config: dict):
    """Update user's avatar configuration."""
    db = get_supabase()
    
    result = db.table("profiles").update({
        "avatar_config": avatar_config,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"avatar_config": result.data[0]["avatar_config"]}


@router.post("/{user_id}/languages")
async def add_language(user_id: str, lang: LanguageInput):
    """Add a language to user's profile."""
    db = get_supabase()
    
    result = db.table("user_languages").insert({
        "user_id": user_id,
        "language_code": lang.language_code,
        "language_name": lang.language_name,
        "proficiency": lang.proficiency,
        "is_primary": lang.is_primary,
        "show_original": lang.show_original
    }).execute()
    
    return {"language": result.data[0] if result.data else None}


@router.delete("/{user_id}/languages/{language_code}")
async def remove_language(user_id: str, language_code: str):
    """Remove a language from user's profile."""
    db = get_supabase()
    
    db.table("user_languages") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("language_code", language_code) \
        .execute()
    
    return {"status": "removed"}


@router.put("/{user_id}/status")
async def update_status(user_id: str, status: str, status_message: str = None, return_date: str = None):
    """Update user's availability status."""
    db = get_supabase()
    
    valid_statuses = ["active", "busy", "away", "break", "offline"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")
    
    update_data = {
        "status": status,
        "status_message": status_message,
        "last_active_at": datetime.utcnow().isoformat()
    }
    if return_date:
        update_data["status_return_date"] = return_date
    
    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    
    return {"status": status, "message": status_message}


@router.get("/{user_id}/relationships")
async def get_relationships(user_id: str):
    """Get all relationships for a user."""
    db = get_supabase()
    
    rels = db.table("relationships") \
        .select("*") \
        .or_(f"user_a_id.eq.{user_id},user_b_id.eq.{user_id}") \
        .order("last_interaction_at", desc=True) \
        .execute()
    
    enriched = []
    for rel in (rels.data or []):
        partner_id = rel["user_b_id"] if rel["user_a_id"] == user_id else rel["user_a_id"]
        partner = db.table("profiles") \
            .select("id, display_name, country, avatar_config, is_verified, status, care_score") \
            .eq("id", partner_id) \
            .single() \
            .execute()
        
        my_role = rel["user_a_role"] if rel["user_a_id"] == user_id else rel["user_b_role"]
        partner_role = rel["user_b_role"] if rel["user_a_id"] == user_id else rel["user_a_role"]
        
        enriched.append({
            **rel,
            "partner": partner.data,
            "my_role": my_role,
            "partner_role": partner_role
        })
    
    return {"relationships": enriched}


@router.get("/{user_id}/notifications")
async def get_notifications(user_id: str, unread_only: bool = False):
    """Get user's notifications."""
    db = get_supabase()
    
    query = db.table("notifications") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(50)
    
    if unread_only:
        query = query.eq("is_read", False)
    
    result = query.execute()
    
    return {"notifications": result.data or []}


@router.put("/{user_id}/notifications/{notification_id}/read")
async def mark_notification_read(user_id: str, notification_id: str):
    """Mark a notification as read."""
    db = get_supabase()
    
    db.table("notifications").update({
        "is_read": True,
        "read_at": datetime.utcnow().isoformat()
    }).eq("id", notification_id).eq("user_id", user_id).execute()
    
    return {"status": "read"}
