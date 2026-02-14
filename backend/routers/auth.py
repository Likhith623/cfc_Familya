"""Authentication router - Sign up, login, verification."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from models.schemas import (
    SignUpRequest, LoginRequest, AuthResponse, 
    VerificationRequest, ProfileUpdate, LanguageInput
)
from services.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignUpRequest):
    """Register a new user."""
    db = get_supabase()
    
    try:
        # Create auth user in Supabase
        auth_response = db.auth.sign_up({
            "email": req.email,
            "password": req.password
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        user_id = auth_response.user.id
        
        # Determine if minor
        today = datetime.utcnow().date()
        age = today.year - req.date_of_birth.year
        is_minor = age < 18
        
        # Create profile
        profile = db.table("profiles").insert({
            "id": user_id,
            "username": req.username,
            "display_name": req.display_name,
            "email": req.email,
            "date_of_birth": req.date_of_birth.isoformat(),
            "gender": req.gender,
            "country": req.country,
            "city": req.city,
            "timezone": req.timezone,
            "is_minor": is_minor
        }).execute()
        
        if not profile.data:
            raise HTTPException(status_code=400, detail="Failed to create profile")
        
        return AuthResponse(
            access_token=auth_response.session.access_token if auth_response.session else "",
            user_id=user_id,
            email=req.email
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login with email and password."""
    db = get_supabase()
    
    try:
        auth_response = db.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last active
        db.table("profiles").update({
            "last_active_at": datetime.utcnow().isoformat(),
            "status": "active"
        }).eq("id", auth_response.user.id).execute()
        
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user_id=auth_response.user.id,
            email=req.email
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/verify")
async def submit_verification(req: VerificationRequest, user_id: str = ""):
    """Submit human verification (video/voice/ID)."""
    db = get_supabase()
    
    # Create verification record
    record = db.table("verification_records").insert({
        "user_id": user_id,
        "verification_type": req.verification_type,
        "video_url": req.video_url,
        "voice_url": req.voice_url,
        "photo_url": req.photo_url,
        "intent_voice_url": req.intent_voice_url,
        "status": "pending",
        "liveness_score": 0.95,  # Mock liveness check
        "is_real_human": True  # Mock - in production, use AI liveness detection
    }).execute()
    
    if record.data:
        # Auto-approve for demo (in production, add to moderation queue)
        db.table("profiles").update({
            "is_verified": True,
            "verification_method": req.verification_type,
            "verified_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        
        db.table("verification_records").update({
            "status": "approved"
        }).eq("id", record.data[0]["id"]).execute()
    
    return {"status": "verified", "badge": "✅ Verified Human"}


@router.get("/me")
async def get_current_user(user_id: str = ""):
    """Get current user's profile."""
    db = get_supabase()
    
    profile = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    languages = db.table("user_languages").select("*").eq("user_id", user_id).execute()
    achievements = db.table("user_achievements") \
        .select("*, achievements(*)") \
        .eq("user_id", user_id) \
        .execute()
    
    return {
        "profile": profile.data,
        "languages": languages.data or [],
        "achievements": achievements.data or []
    }
