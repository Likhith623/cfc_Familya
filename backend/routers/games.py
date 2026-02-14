"""Games router - Fun & emotional games."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from models.schemas import StartGameRequest, GameActionRequest
from services.supabase_client import get_supabase
from services.auth_service import get_current_user_id, get_optional_user_id

router = APIRouter(prefix="/games", tags=["Games"])


def _get_initial_game_data(game_type: str) -> dict:
    """Get initial game data based on game type."""
    if game_type == "emotion_charades":
        return {
            "emotions": ["happy", "sad", "excited", "nervous", "grateful", "nostalgic", "hopeful", "peaceful"],
            "current_emotion": None,
            "guesses": []
        }
    elif game_type == "two_truths_lie":
        return {
            "statements": [],
            "guesses": [],
            "reveals": []
        }
    elif game_type == "story_chain":
        return {
            "story": [],
            "word_limit": 20
        }
    elif game_type == "gratitude_jar":
        return {
            "entries": [],
            "read_entries": []
        }
    elif game_type == "would_you_rather":
        return {
            "questions": [
                {"a": "Be able to speak every language", "b": "Be able to talk to animals"},
                {"a": "Live in the past", "b": "Live in the future"},
                {"a": "Have unlimited money", "b": "Have unlimited time"},
                {"a": "Know how you die", "b": "Know when you die"},
                {"a": "Be famous", "b": "Be rich"}
            ],
            "answers": {},
            "predictions": {}
        }
    return {}


@router.get("/")
async def get_all_games():
    """Get all available games."""
    db = get_supabase()
    
    games = db.table("games") \
        .select("*") \
        .eq("is_active", True) \
        .order("category") \
        .execute()
    
    # Group by category
    categories = {}
    for game in (games.data or []):
        cat = game.get("category", "other")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(game)
    
    return {"games": games.data or [], "categories": categories}


@router.post("/start")
async def start_game(req: StartGameRequest, user_id: str = Depends(get_current_user_id)):
    """Start a game session."""
    db = get_supabase()
    
    game = db.table("games").select("*").eq("id", req.game_id).execute()
    if not game.data or len(game.data) == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_data = game.data[0]
    
    # Get partner(s)
    players = [{"user_id": user_id, "score": 0}]
    
    if req.relationship_id:
        rel = db.table("relationships").select("*").eq("id", req.relationship_id).execute()
        if rel.data and len(rel.data) > 0:
            rel_data = rel.data[0]
            partner_id = rel_data["user_b_id"] if rel_data["user_a_id"] == user_id else rel_data["user_a_id"]
            players.append({"user_id": partner_id, "score": 0})
    
    session = db.table("game_sessions").insert({
        "game_id": req.game_id,
        "relationship_id": req.relationship_id,
        "room_id": req.room_id,
        "players": players,
        "status": "active",
        "current_round": 1,
        "total_rounds": game_data.get("estimated_minutes", 10) // 2,
        "started_at": datetime.utcnow().isoformat(),
        "game_data": _get_initial_game_data(game_data["game_type"])
    }).execute()
    
    if not session.data:
        raise HTTPException(status_code=500, detail="Failed to start game")
    
    # Notify partner
    if req.relationship_id and len(players) > 1:
        db.table("notifications").insert({
            "user_id": players[1]["user_id"],
            "type": "game_invite",
            "title": f"🎮 {game_data['title']} - Game Invite!",
            "body": "Your partner wants to play! Join now!",
            "data": {"session_id": session.data[0]["id"], "game_id": req.game_id}
        }).execute()
    
    return {
        "session": session.data[0],
        "game": game_data,
        "initial_data": session.data[0].get("game_data", {})
    }


@router.post("/action")
async def game_action(req: GameActionRequest, user_id: str = Depends(get_current_user_id)):
    """Perform a game action (answer, submit, etc.)."""
    db = get_supabase()
    
    session = db.table("game_sessions").select("*").eq("id", req.session_id).execute()
    if not session.data or len(session.data) == 0:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    session_data = session.data[0]
    game_data = session_data.get("game_data", {})
    players = session_data.get("players", [])
    
    # Process action based on game type
    game = db.table("games").select("game_type, bond_points_reward").eq("id", session_data["game_id"]).execute()
    game_info = game.data[0] if game.data else {}
    game_type = game_info.get("game_type", "")
    
    result = {"success": True}
    
    if req.action_type == "submit":
        game_data[f"answer_{user_id}"] = req.action_data
        result["submitted"] = True
    elif req.action_type == "guess":
        game_data.setdefault("guesses", []).append({
            "user_id": user_id,
            "guess": req.action_data,
            "timestamp": datetime.utcnow().isoformat()
        })
        result["guess_recorded"] = True
    elif req.action_type == "reveal":
        game_data.setdefault("reveals", []).append(req.action_data)
        result["revealed"] = True
    elif req.action_type == "complete":
        # End the game session
        bond_points = game_info.get("bond_points_reward", 5)
        
        db.table("game_sessions").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "bond_points_awarded": bond_points
        }).eq("id", req.session_id).execute()
        
        # Award bond points to relationship
        if session_data.get("relationship_id"):
            rel = db.table("relationships").select("bond_points").eq("id", session_data["relationship_id"]).execute()
            current_points = rel.data[0].get("bond_points", 0) if rel.data else 0
            db.table("relationships").update({
                "bond_points": current_points + bond_points
            }).eq("id", session_data["relationship_id"]).execute()
        
        result["completed"] = True
        result["bond_points_awarded"] = bond_points
    
    # Update game data
    if req.action_type != "complete":
        db.table("game_sessions").update({
            "game_data": game_data,
            "current_round": session_data.get("current_round", 0) + 1 if req.action_type == "next_round" else session_data.get("current_round", 0)
        }).eq("id", req.session_id).execute()
    
    return result


@router.get("/session/{session_id}")
async def get_game_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    """Get current game session state."""
    db = get_supabase()
    
    session = db.table("game_sessions") \
        .select("*, games(*)") \
        .eq("id", session_id) \
        .execute()
    
    if not session.data or len(session.data) == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"session": session.data[0]}


@router.get("/history/{relationship_id}")
async def get_game_history(relationship_id: str, user_id: str = Depends(get_current_user_id)):
    """Get game history for a relationship."""
    db = get_supabase()
    
    sessions = db.table("game_sessions") \
        .select("*, games(title, icon_emoji, category)") \
        .eq("relationship_id", relationship_id) \
        .eq("status", "completed") \
        .order("completed_at", desc=True) \
        .limit(20) \
        .execute()
    
    total_points = sum(s.get("bond_points_awarded", 0) for s in (sessions.data or []))
    
    return {
        "sessions": sessions.data or [],
        "total_games": len(sessions.data or []),
        "total_bond_points": total_points
    }
