"""Safety router - Reports, moderation, bond severing."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from models.schemas import ReportRequest, SeverBondRequest
from services.supabase_client import get_supabase

router = APIRouter(prefix="/safety", tags=["Safety"])


@router.post("/report")
async def report_user(req: ReportRequest, user_id: str = ""):
    """Report a user for inappropriate behavior."""
    db = get_supabase()
    
    # Create report
    report = db.table("reports").insert({
        "reporter_id": user_id,
        "reported_user_id": req.reported_user_id,
        "relationship_id": req.relationship_id,
        "reason": req.reason,
        "description": req.description,
        "status": "pending"
    }).execute()
    
    if report.data:
        # Add to moderation queue
        db.table("moderation_queue").insert({
            "user_id": req.reported_user_id,
            "queue_type": "report_review",
            "priority": "high" if req.reason in ["harassment", "threatening", "underage"] else "normal",
            "reference_id": report.data[0]["id"],
            "reference_type": "report",
            "status": "pending"
        }).execute()
        
        # Immediately pause matching for reported user
        db.table("matching_queue") \
            .update({"status": "cancelled"}) \
            .eq("user_id", req.reported_user_id) \
            .eq("status", "searching") \
            .execute()
    
    return {
        "status": "reported",
        "message": "Thank you for reporting. Our human moderators will review this within 24 hours.",
        "report_id": report.data[0]["id"] if report.data else None
    }


@router.post("/sever")
async def sever_bond(req: SeverBondRequest, user_id: str = ""):
    """One-tap sever a relationship bond."""
    db = get_supabase()
    
    rel = db.table("relationships").select("*").eq("id", req.relationship_id).single().execute()
    if not rel.data:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    # Determine partner
    partner_id = rel.data["user_b_id"] if rel.data["user_a_id"] == user_id else rel.data["user_a_id"]
    
    # End the relationship
    farewell_field = "farewell_message_a" if rel.data["user_a_id"] == user_id else "farewell_message_b"
    
    db.table("relationships").update({
        "status": "ended",
        "ended_by": user_id,
        "end_reason": "severed",
        farewell_field: req.farewell_message or "It was nice knowing you. Best wishes!",
        "ended_at": datetime.utcnow().isoformat()
    }).eq("id", req.relationship_id).execute()
    
    # Notify partner
    db.table("notifications").insert({
        "user_id": partner_id,
        "type": "relationship_ended",
        "title": "A bond has ended",
        "body": "One of your connections has chosen to part ways. Remember the good moments! 💙",
        "data": {"relationship_id": req.relationship_id}
    }).execute()
    
    return {
        "status": "severed",
        "cooldown": "24 hours before next match",
        "message": "The bond has been ended. You have a 24-hour cooldown before matching again."
    }


@router.post("/exit-survey")
async def submit_exit_survey(
    relationship_id: str,
    reason: str,
    additional_feedback: str = None,
    would_recommend: bool = True,
    rating: int = 3,
    user_id: str = ""
):
    """Submit an exit survey after ending a relationship."""
    db = get_supabase()
    
    survey = db.table("exit_surveys").insert({
        "user_id": user_id,
        "relationship_id": relationship_id,
        "reason": reason,
        "additional_feedback": additional_feedback,
        "would_recommend": would_recommend,
        "rating": rating
    }).execute()
    
    return {"status": "submitted", "survey": survey.data[0] if survey.data else None}


@router.get("/reliability/{user_id}")
async def get_reliability_info(user_id: str):
    """Get user's reliability information and ghosting protection status."""
    db = get_supabase()
    
    profile = db.table("profiles") \
        .select("reliability_score, status, status_message, last_active_at, status_return_date") \
        .eq("id", user_id) \
        .single() \
        .execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "reliability_score": profile.data["reliability_score"],
        "current_status": profile.data["status"],
        "status_message": profile.data["status_message"],
        "last_active": profile.data["last_active_at"],
        "return_date": profile.data["status_return_date"],
        "ghosting_protection": {
            "grace_period_days": 7,
            "available_statuses": [
                {"value": "active", "label": "Active", "emoji": "🟢"},
                {"value": "busy", "label": "Busy (will reply slower)", "emoji": "🟡"},
                {"value": "away", "label": "Away (back in X days)", "emoji": "🟠"},
                {"value": "break", "label": "Taking a break", "emoji": "🔴"}
            ],
            "policy": "No response + No status update for 7 days → Relationship auto-paused, partner notified"
        }
    }


@router.get("/minor-protection/{user_id}")
async def get_minor_protection_settings(user_id: str):
    """Get minor protection settings."""
    db = get_supabase()
    
    profile = db.table("profiles") \
        .select("is_minor, parent_email, parent_approved, date_of_birth") \
        .eq("id", user_id) \
        .single() \
        .execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if not profile.data["is_minor"]:
        return {"is_minor": False, "protections": None}
    
    return {
        "is_minor": True,
        "parent_approved": profile.data["parent_approved"],
        "parent_email": profile.data["parent_email"],
        "protections": {
            "cannot_match": ["Adults in parent roles without verified mentor badge"],
            "cannot_access": ["Voice calls until Level 3", "Photo sharing until Level 2"],
            "must_have": ["AI monitoring on all chats", "Weekly parent reports"],
            "allowed_matches": {
                "verified_educators": "Teachers with background checks",
                "peer_roles": "Friend, sibling roles with age-matched users (±3 years)",
                "family_roles": "Only if adult has 'Verified Mentor' badge + background check"
            }
        }
    }
