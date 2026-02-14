"""Matching router - Find and create bonds."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from models.schemas import MatchRequest
from services.supabase_client import get_supabase
from services.matching_service import find_match, create_relationship
from services.auth_service import get_current_user_id

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/search")
async def search_for_match(req: MatchRequest, user_id: str = Depends(get_current_user_id)):
    """Enter the matching queue and search for a partner."""
    db = get_supabase()
    
    # Check if user is verified
    profile = db.table("profiles").select("is_verified, is_banned").eq("id", user_id).execute()
    if not profile.data or len(profile.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile_data = profile.data[0]
    if profile_data.get("is_banned"):
        raise HTTPException(status_code=403, detail="Account is banned")
    
    # Cancel any existing queue entries
    db.table("matching_queue") \
        .update({"status": "cancelled"}) \
        .eq("user_id", user_id) \
        .eq("status", "searching") \
        .execute()
    
    # Add to matching queue
    queue_entry = db.table("matching_queue").insert({
        "user_id": user_id,
        "seeking_role": req.seeking_role,
        "offering_role": req.offering_role,
        "preferred_age_min": req.preferred_age_min,
        "preferred_age_max": req.preferred_age_max,
        "preferred_countries": req.preferred_countries,
        "preferred_languages": [],
        "language_priority": req.language_priority,
        "status": "searching"
    }).execute()
    
    # Try to find a match immediately
    match_result = await find_match(user_id, req.seeking_role, req.offering_role)
    
    if match_result:
        candidate = match_result
        candidate_id = candidate["candidate_id"]
        
        # Create relationship
        relationship = await create_relationship(
            user_a_id=user_id,
            user_b_id=candidate_id,
            role_a=req.offering_role,
            role_b=candidate["queue_entry"]["offering_role"]
        )
        
        # Update queue entries
        db.table("matching_queue") \
            .update({"status": "matched", "matched_with": candidate_id, "matched_at": datetime.utcnow().isoformat()}) \
            .eq("user_id", user_id) \
            .eq("status", "searching") \
            .execute()
        
        db.table("matching_queue") \
            .update({"status": "matched", "matched_with": user_id, "matched_at": datetime.utcnow().isoformat()}) \
            .eq("user_id", candidate_id) \
            .eq("status", "searching") \
            .execute()
        
        # Get partner profile
        partner_profile = db.table("profiles") \
            .select("id, display_name, country, city, avatar_config, is_verified, care_score, bio") \
            .eq("id", candidate_id) \
            .execute()
        
        return {
            "status": "matched",
            "relationship": relationship,
            "partner": partner_profile.data[0] if partner_profile.data else None,
            "match_score": candidate["score"]
        }
    
    # No immediate match - get queue position
    queue_count = db.table("matching_queue") \
        .select("id", count="exact") \
        .eq("status", "searching") \
        .eq("seeking_role", req.seeking_role) \
        .execute()
    
    return {
        "status": "searching",
        "queue_id": queue_entry.data[0]["id"] if queue_entry.data else None,
        "queue_position": queue_count.count or 1,
        "estimated_wait": "2-5 minutes",
        "tips": [
            "Complete your profile to increase match chances",
            "Add more languages for wider matching",
            "Record your voice bio for better connections"
        ]
    }


@router.get("/queue/{user_id}")
async def check_queue_status(user_id: str, current_user: str = Depends(get_current_user_id)):
    """Check current matching queue status."""
    db = get_supabase()
    
    entry = db.table("matching_queue") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("status", "searching") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    
    if not entry.data:
        return {"status": "not_in_queue"}
    
    return {
        "status": "searching",
        "queue_entry": entry.data[0],
        "seeking_role": entry.data[0]["seeking_role"],
        "offering_role": entry.data[0]["offering_role"]
    }


@router.delete("/queue/{user_id}")
async def cancel_matching(user_id: str, current_user: str = Depends(get_current_user_id)):
    """Cancel matching search."""
    db = get_supabase()
    
    db.table("matching_queue") \
        .update({"status": "cancelled"}) \
        .eq("user_id", user_id) \
        .eq("status", "searching") \
        .execute()
    
    return {"status": "cancelled"}


@router.get("/roles")
async def get_available_roles():
    """Get available relationship roles with descriptions."""
    return {
        "roles": [
            {
                "id": "mother", "label": "Digital Mother", "emoji": "👩",
                "description": "A caring, nurturing presence who offers guidance and warmth",
                "pairs_with": "son/daughter"
            },
            {
                "id": "father", "label": "Digital Father", "emoji": "👨",
                "description": "A supportive, wise presence who offers stability and advice",
                "pairs_with": "son/daughter"
            },
            {
                "id": "son", "label": "Digital Son", "emoji": "👦",
                "description": "Someone seeking parental guidance and a family connection",
                "pairs_with": "mother/father"
            },
            {
                "id": "daughter", "label": "Digital Daughter", "emoji": "👧",
                "description": "Someone seeking parental guidance and a family connection",
                "pairs_with": "mother/father"
            },
            {
                "id": "mentor", "label": "Mentor", "emoji": "🎓",
                "description": "An experienced guide who shares knowledge and wisdom",
                "pairs_with": "student"
            },
            {
                "id": "student", "label": "Student", "emoji": "📚",
                "description": "An eager learner seeking guidance and growth",
                "pairs_with": "mentor"
            },
            {
                "id": "brother", "label": "Digital Brother", "emoji": "👦",
                "description": "A peer-level bond with shared adventures and support",
                "pairs_with": "brother/sister"
            },
            {
                "id": "sister", "label": "Digital Sister", "emoji": "👧",
                "description": "A peer-level bond with shared adventures and support",
                "pairs_with": "brother/sister"
            },
            {
                "id": "friend", "label": "Global Friend", "emoji": "🤝",
                "description": "A cross-cultural friendship based on shared interests",
                "pairs_with": "friend"
            },
            {
                "id": "grandparent", "label": "Digital Grandparent", "emoji": "👴",
                "description": "Wisdom of a lifetime, stories from another era",
                "pairs_with": "grandchild"
            },
            {
                "id": "grandchild", "label": "Digital Grandchild", "emoji": "🧒",
                "description": "Youthful energy with a desire to learn from elders",
                "pairs_with": "grandparent"
            }
        ]
    }
