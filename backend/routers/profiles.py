"""Profile management router."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.schemas import ProfileUpdate, LanguageInput
from services.supabase_client import get_supabase
from services.auth_service import get_current_user_id, get_optional_user_id

router = APIRouter(prefix="/profiles", tags=["Profiles"])

# Valid roles
VALID_ROLES = ["mother", "father", "son", "daughter", "mentor", "student", 
               "brother", "sister", "friend", "grandparent", "grandchild", 
               "sibling", "penpal"]


class SetRoleRequest(BaseModel):
    offering_role: str  # What role the user wants to BE
    seeking_role: Optional[str] = None  # What role they're looking for (optional)


@router.post("/me/role")
async def set_my_role(req: SetRoleRequest, current_user: str = Depends(get_current_user_id)):
    """Set the current user's role for matching."""
    db = get_supabase()
    
    role_lower = req.offering_role.lower().strip()
    if role_lower not in VALID_ROLES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role '{req.offering_role}'. Valid roles: {', '.join(VALID_ROLES)}"
        )
    
    # Get current matching_preferences
    profile = db.table("profiles").select("matching_preferences").eq("id", current_user).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update matching_preferences with the role (using JSONB which exists)
    prefs = profile.data[0].get("matching_preferences") or {}
    prefs["offering_role"] = role_lower
    prefs["preferred_roles"] = [role_lower]
    if req.seeking_role:
        prefs["seeking_role"] = req.seeking_role.lower().strip()
    
    update_data = {
        "matching_preferences": prefs,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = db.table("profiles").update(update_data).eq("id", current_user).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Failed to update profile")
    
    return {
        "success": True,
        "offering_role": role_lower,
        "seeking_role": req.seeking_role.lower().strip() if req.seeking_role else None,
        "message": f"You are now registered as a '{role_lower}'"
    }


@router.get("/{user_id}")
async def get_profile(user_id: str, current_user: str = Depends(get_optional_user_id)):
    """Get a user's public profile."""
    db = get_supabase()
    
    profile = db.table("profiles") \
        .select("id, username, display_name, country, city, timezone, bio, voice_bio_url, profile_photo_url, avatar_config, is_verified, care_score, reliability_score, total_bond_points, status, created_at") \
        .eq("id", user_id) \
        .execute()
    
    if not profile.data or len(profile.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_data = profile.data[0]
    
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
        "profile": profile_data,
        "languages": languages.data or [],
        "achievements": achievements.data or [],
        "active_relationships": len(rels.data or [])
    }


# ─── Current User Endpoints (/me) ───────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(current_user: str = Depends(get_current_user_id)):
    """Get the current user's profile."""
    return await get_profile(current_user, current_user)


@router.put("/me")
async def update_my_profile(update: ProfileUpdate, current_user: str = Depends(get_current_user_id)):
    """Update the current user's profile."""
    db = get_supabase()
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = db.table("profiles").update(update_data).eq("id", current_user).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


# ─── User ID Endpoints ───────────────────────────────────────────────────────────

@router.put("/{user_id}")
async def update_profile(user_id: str, update: ProfileUpdate, current_user: str = Depends(get_current_user_id)):
    """Update user profile."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    
    db = get_supabase()
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"profile": result.data[0]}


@router.put("/{user_id}/avatar")
async def update_avatar(user_id: str, avatar_config: dict, current_user: str = Depends(get_current_user_id)):
    """Update user's avatar configuration."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's avatar")
    
    db = get_supabase()
    
    result = db.table("profiles").update({
        "avatar_config": avatar_config,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"avatar_config": result.data[0]["avatar_config"]}


@router.post("/{user_id}/languages")
async def add_language(user_id: str, lang: LanguageInput, current_user: str = Depends(get_current_user_id)):
    """Add a language to user's profile."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's languages")
    
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
async def remove_language(user_id: str, language_code: str, current_user: str = Depends(get_current_user_id)):
    """Remove a language from user's profile."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's languages")
    
    db = get_supabase()
    
    db.table("user_languages") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("language_code", language_code) \
        .execute()
    
    return {"status": "removed"}


@router.put("/{user_id}/status")
async def update_status(
    user_id: str, 
    status: str, 
    status_message: str = None, 
    return_date: str = None,
    current_user: str = Depends(get_current_user_id)
):
    """Update user's availability status."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's status")
    
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
async def get_relationships(user_id: str, current_user: str = Depends(get_optional_user_id)):
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
            .execute()
        
        partner_data = partner.data[0] if partner.data else None
        
        my_role = rel["user_a_role"] if rel["user_a_id"] == user_id else rel["user_b_role"]
        partner_role = rel["user_b_role"] if rel["user_a_id"] == user_id else rel["user_a_role"]
        
        enriched.append({
            **rel,
            "partner": partner_data,
            "my_role": my_role,
            "partner_role": partner_role
        })
    
    return {"relationships": enriched}


@router.get("/{user_id}/notifications")
async def get_notifications(user_id: str, unread_only: bool = False, current_user: str = Depends(get_optional_user_id)):
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
async def mark_notification_read(user_id: str, notification_id: str, current_user: str = Depends(get_current_user_id)):
    """Mark a notification as read."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's notifications")
    
    db = get_supabase()
    
    db.table("notifications").update({
        "is_read": True,
        "read_at": datetime.utcnow().isoformat()
    }).eq("id", notification_id).eq("user_id", user_id).execute()
    
    return {"status": "read"}


@router.put("/{user_id}/notifications/read-all")
async def mark_all_notifications_read(user_id: str, current_user: str = Depends(get_current_user_id)):
    """Mark all notifications as read for a user."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's notifications")
    
    db = get_supabase()
    
    db.table("notifications").update({
        "is_read": True,
        "read_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).eq("is_read", False).execute()
    
    return {"status": "all_read"}


@router.delete("/{user_id}/notifications/{notification_id}")
async def delete_notification(user_id: str, notification_id: str, current_user: str = Depends(get_current_user_id)):
    """Delete a single notification."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's notifications")
    
    db = get_supabase()
    db.table("notifications").delete().eq("id", notification_id).eq("user_id", user_id).execute()
    
    return {"status": "deleted"}


@router.delete("/{user_id}/notifications")
async def clear_all_notifications(user_id: str, current_user: str = Depends(get_current_user_id)):
    """Clear all notifications for a user."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another user's notifications")
    
    db = get_supabase()
    db.table("notifications").delete().eq("user_id", user_id).execute()
    
    return {"status": "cleared"}
