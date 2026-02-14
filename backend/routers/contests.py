"""Contests router - Bonding quizzes and challenges."""
from fastapi import APIRouter, HTTPException
from models.schemas import ContestRequest, AnswerRequest
from services.supabase_client import get_supabase
from services.contest_service import generate_contest, submit_answer, complete_contest

router = APIRouter(prefix="/contests", tags=["Contests"])


@router.post("/create")
async def create_contest(req: ContestRequest, user_id: str = ""):
    """Create a new bonding contest for a relationship."""
    result = await generate_contest(req.relationship_id, req.contest_type)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/relationship/{relationship_id}")
async def get_contests(relationship_id: str):
    """Get all contests for a relationship."""
    db = get_supabase()
    
    contests = db.table("contests") \
        .select("*") \
        .eq("relationship_id", relationship_id) \
        .order("created_at", desc=True) \
        .execute()
    
    return {"contests": contests.data or []}


@router.get("/{contest_id}")
async def get_contest_details(contest_id: str):
    """Get contest details with questions."""
    db = get_supabase()
    
    contest = db.table("contests").select("*").eq("id", contest_id).single().execute()
    if not contest.data:
        raise HTTPException(status_code=404, detail="Contest not found")
    
    questions = db.table("contest_questions") \
        .select("id, question_text, question_type, options, points, question_order, question_about_user") \
        .eq("contest_id", contest_id) \
        .order("question_order") \
        .execute()
    
    return {
        "contest": contest.data,
        "questions": questions.data or []
    }


@router.post("/answer")
async def answer_question(req: AnswerRequest, user_id: str = ""):
    """Submit an answer for a contest question."""
    result = await submit_answer(req.question_id, user_id, req.answer)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{contest_id}/complete")
async def finish_contest(contest_id: str, user_id: str = ""):
    """Complete a contest and calculate scores."""
    result = await complete_contest(contest_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/schedule/{relationship_id}")
async def get_contest_schedule(relationship_id: str):
    """Get the contest schedule for a relationship."""
    return {
        "schedule": {
            "weekly": {
                "day": "Sunday",
                "time": "Auto-triggered after 7 days of chatting",
                "questions": 5,
                "time_limit": "10 minutes",
                "both_must_participate": True,
                "max_points": 50
            },
            "daily": {
                "type": "Quick questions (optional)",
                "example": "Guess your partner's mood today",
                "questions": 3,
                "time_limit": "5 minutes",
                "optional": True,
                "max_points": 30
            },
            "monthly": {
                "type": "Championship (opt-in)",
                "global": True,
                "prizes": "Real rewards & special badges",
                "registration": "Must have 70+ care score",
                "questions": 10,
                "time_limit": "20 minutes"
            }
        }
    }
