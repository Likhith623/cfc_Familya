"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ── Auth ──────────────────────────────────────────────
class SignUpRequest(BaseModel):
    email: str
    password: str
    username: str
    display_name: str
    date_of_birth: date
    country: str
    timezone: str = "UTC"
    gender: Optional[str] = None
    city: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str


# ── Profile ───────────────────────────────────────────
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    gender: Optional[str] = None
    avatar_config: Optional[dict] = None
    status: Optional[str] = None
    status_message: Optional[str] = None
    matching_preferences: Optional[dict] = None


class LanguageInput(BaseModel):
    language_code: str
    language_name: str
    proficiency: str = "native"
    is_primary: bool = False
    show_original: bool = False


# ── Matching ──────────────────────────────────────────
class MatchRequest(BaseModel):
    seeking_role: str  # Role they want to find
    offering_role: str  # Role they want to be
    preferred_age_min: int = 13
    preferred_age_max: int = 99
    preferred_countries: List[str] = []
    language_priority: str = "ease"  # 'ease' or 'learning'


# ── Messages ──────────────────────────────────────────
class SendMessageRequest(BaseModel):
    relationship_id: str
    content_type: str = "text"
    original_text: str
    original_language: Optional[str] = None
    voice_url: Optional[str] = None
    image_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    original_text: str
    translated_text: Optional[str] = None
    has_idiom: bool = False
    idiom_explanation: Optional[str] = None
    cultural_note: Optional[str] = None
    content_type: str = "text"
    created_at: str


# ── Contests ──────────────────────────────────────────
class ContestRequest(BaseModel):
    relationship_id: str
    contest_type: str = "weekly"


class AnswerRequest(BaseModel):
    question_id: str
    answer: str


# ── Games ─────────────────────────────────────────────
class StartGameRequest(BaseModel):
    game_id: str
    relationship_id: Optional[str] = None
    room_id: Optional[str] = None


class GameActionRequest(BaseModel):
    session_id: str
    action: str  # Game-specific action
    data: Optional[dict] = None


# ── Family Rooms ──────────────────────────────────────
class CreateRoomRequest(BaseModel):
    room_name: str
    description: Optional[str] = None
    room_type: str = "family"
    max_members: int = 8


class InviteToRoomRequest(BaseModel):
    user_id: str
    role_in_room: str


class RoomMessageRequest(BaseModel):
    room_id: str
    content_type: str = "text"
    original_text: str
    original_language: Optional[str] = None


# ── Cultural Potluck ──────────────────────────────────
class CreatePotluckRequest(BaseModel):
    room_id: str
    theme: str
    dish_name: Optional[str] = None
    cultural_significance: Optional[str] = None
    recipe: Optional[str] = None
    country_of_origin: Optional[str] = None
    scheduled_at: str


# ── Safety ────────────────────────────────────────────
class ReportRequest(BaseModel):
    reported_user_id: str
    relationship_id: Optional[str] = None
    reason: str
    description: Optional[str] = None


class SeverBondRequest(BaseModel):
    relationship_id: str
    farewell_message: Optional[str] = None


# ── Verification ──────────────────────────────────────
class VerificationRequest(BaseModel):
    verification_type: str  # 'video', 'voice_photo', 'government_id'
    video_url: Optional[str] = None
    voice_url: Optional[str] = None
    photo_url: Optional[str] = None
    intent_voice_url: Optional[str] = None


# ── Time Capsule ──────────────────────────────────────
class TimeCapsuleRequest(BaseModel):
    relationship_id: str
    content: str
    content_type: str = "text"
    media_url: Optional[str] = None
    open_date: str  # ISO date


# ── Gratitude ─────────────────────────────────────────
class GratitudeRequest(BaseModel):
    relationship_id: str
    about_user_id: str
    message: str
    is_anonymous: bool = False
