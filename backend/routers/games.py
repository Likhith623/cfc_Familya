"""Games router - Fun & emotional games."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from models.schemas import StartGameRequest, GameActionRequest
from services.supabase_client import get_supabase

router = APIRouter(prefix="/games", tags=["Games"])


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
async def start_game(req: StartGameRequest, user_id: str = ""):
    """Start a game session."""
    db = get_supabase()
    
    game = db.table("games").select("*").eq("id", req.game_id).single().execute()
    if not game.data:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get partner(s)
    players = [{"user_id": user_id, "score": 0}]
    
    if req.relationship_id:
        rel = db.table("relationships").select("*").eq("id", req.relationship_id).single().execute()
        if rel.data:
            partner_id = rel.data["user_b_id"] if rel.data["user_a_id"] == user_id else rel.data["user_a_id"]
            players.append({"user_id": partner_id, "score": 0})
    
    session = db.table("game_sessions").insert({
        "game_id": req.game_id,
        "relationship_id": req.relationship_id,
        "room_id": req.room_id,
        "players": players,
        "status": "active",
        "current_round": 1,
        "total_rounds": game.data.get("estimated_minutes", 10) // 2,
        "started_at": datetime.utcnow().isoformat(),
        "game_data": _get_initial_game_data(game.data["game_type"])
    }).execute()
    
    if not session.data:
        raise HTTPException(status_code=500, detail="Failed to start game")
    
    # Notify partner
    if req.relationship_id and len(players) > 1:
        db.table("notifications").insert({
            "user_id": players[1]["user_id"],
            "type": "game_invite",
            "title": f"🎮 {game.data['title']} - Game Invite!",
            "body": "Your partner wants to play! Join now!",
            "data": {"session_id": session.data[0]["id"], "game_id": req.game_id}
        }).execute()
    
    return {
        "session": session.data[0],
        "game": game.data,
        "initial_data": session.data[0].get("game_data", {})
    }


@router.post("/action")
async def game_action(req: GameActionRequest, user_id: str = ""):
    """Perform a game action (answer, submit, etc.)."""
    db = get_supabase()
    
    session = db.table("game_sessions").select("*").eq("id", req.session_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    session_data = session.data
    game_data = session_data.get("game_data", {})
    players = session_data.get("players", [])
    
    # Process action based on game type
    game = db.table("games").select("game_type").eq("id", session_data["game_id"]).single().execute()
    game_type = game.data["game_type"] if game.data else ""
    
    result = {"success": True}
    
    if req.action == "answer":
        # Score the answer
        for p in players:
            if p["user_id"] == user_id:
                p["score"] = p.get("score", 0) + (req.data or {}).get("points", 5)
        
        current_round = session_data.get("current_round", 1) + 1
        
        if current_round > session_data.get("total_rounds", 5):
            # Game complete
            winner = max(players, key=lambda p: p.get("score", 0))
            
            db.table("game_sessions").update({
                "status": "completed",
                "players": players,
                "current_round": current_round,
                "winner_id": winner["user_id"],
                "bond_points_awarded": sum(p.get("score", 0) for p in players),
                "completed_at": datetime.utcnow().isoformat()
            }).eq("id", req.session_id).execute()
            
            # Award bond points to relationship
            if session_data.get("relationship_id"):
                rel = db.table("relationships").select("bond_points").eq("id", session_data["relationship_id"]).single().execute()
                if rel.data:
                    db.table("relationships").update({
                        "bond_points": rel.data["bond_points"] + sum(p.get("score", 0) for p in players)
                    }).eq("id", session_data["relationship_id"]).execute()
            
            result = {
                "success": True,
                "game_over": True,
                "winner": winner,
                "players": players,
                "total_points": sum(p.get("score", 0) for p in players)
            }
        else:
            db.table("game_sessions").update({
                "players": players,
                "current_round": current_round,
                "game_data": {**game_data, **(req.data or {})}
            }).eq("id", req.session_id).execute()
            
            result = {
                "success": True,
                "game_over": False,
                "current_round": current_round,
                "players": players
            }
    
    return result


@router.get("/session/{session_id}")
async def get_game_session(session_id: str):
    """Get game session details."""
    db = get_supabase()
    
    session = db.table("game_sessions").select("*, games(*)").eq("id", session_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"session": session.data}


@router.get("/history/{relationship_id}")
async def get_game_history(relationship_id: str):
    """Get game history for a relationship."""
    db = get_supabase()
    
    sessions = db.table("game_sessions") \
        .select("*, games(title, icon_emoji, category)") \
        .eq("relationship_id", relationship_id) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()
    
    return {"sessions": sessions.data or []}


def _get_initial_game_data(game_type: str) -> dict:
    """Get initial game data based on game type."""
    data_map = {
        "emotion_charades": {
            "emotions": ["joy", "surprise", "nostalgia", "excitement", "gratitude", "determination", "serenity", "curiosity"],
            "current_emotion": "joy",
            "guesses": []
        },
        "two_truths_lie": {
            "statements": [],
            "guesses": [],
            "revealed": False
        },
        "story_chain": {
            "story": [],
            "current_writer": None
        },
        "mood_mirror": {
            "guesses": {},
            "actual_moods": {}
        },
        "music_swap": {
            "songs": {},
            "guesses": {}
        },
        "would_you_rather": {
            "questions": [
                {"q": "Would you rather travel to the past or the future?", "options": ["Past", "Future"]},
                {"q": "Would you rather always know the truth or always be believed?", "options": ["Know truth", "Be believed"]},
                {"q": "Would you rather have the ability to fly or be invisible?", "options": ["Fly", "Invisible"]},
                {"q": "Would you rather live in the mountains or by the ocean?", "options": ["Mountains", "Ocean"]},
                {"q": "Would you rather always be too hot or always be too cold?", "options": ["Too hot", "Too cold"]}
            ],
            "answers": {},
            "predictions": {}
        },
        "gratitude_jar": {
            "entries": [],
            "round": 1
        },
        "memory_lane": {
            "memories": {},
            "guesses": {}
        }
    }
    
    return data_map.get(game_type, {})
