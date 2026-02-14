import random
from datetime import datetime, timedelta
from services.supabase_client import get_supabase


QUESTION_TEMPLATES = [
    {"template": "What is {name}'s favorite food?", "category": "favorite_food"},
    {"template": "What is {name}'s favorite color?", "category": "favorite_color"},
    {"template": "What is {name}'s biggest hobby?", "category": "hobby"},
    {"template": "What was {name}'s childhood fear?", "category": "fear"},
    {"template": "What is {name}'s biggest dream?", "category": "dream"},
    {"template": "Does {name} have any pets? If so, what kind?", "category": "pet"},
    {"template": "What is {name}'s favorite movie or show?", "category": "favorite_movie"},
    {"template": "What kind of music does {name} like most?", "category": "favorite_music"},
    {"template": "What is {name}'s favorite place to visit?", "category": "favorite_place"},
    {"template": "What is {name}'s proudest achievement?", "category": "achievement"},
    {"template": "What cultural tradition is important to {name}?", "category": "cultural_tradition"},
    {"template": "What does {name} usually do on weekends?", "category": "daily_routine"},
]


async def generate_contest(relationship_id: str, contest_type: str = "weekly") -> dict:
    """Generate a bonding contest for a relationship."""
    db = get_supabase()
    
    # Get relationship info
    rel = db.table("relationships").select("*").eq("id", relationship_id).execute()
    if not rel.data or len(rel.data) == 0:
        return {"error": "Relationship not found"}
    
    rel_data = rel.data[0]
    user_a = db.table("profiles").select("display_name").eq("id", rel_data["user_a_id"]).execute()
    user_b = db.table("profiles").select("display_name").eq("id", rel_data["user_b_id"]).execute()
    
    name_a = user_a.data[0]["display_name"] if user_a.data else "Partner A"
    name_b = user_b.data[0]["display_name"] if user_b.data else "Partner B"
    
    # Get facts from chat history
    facts_a = db.table("chat_facts") \
        .select("*") \
        .eq("user_id", rel_data["user_a_id"]) \
        .eq("relationship_id", relationship_id) \
        .eq("used_in_contest", False) \
        .execute()
    
    facts_b = db.table("chat_facts") \
        .select("*") \
        .eq("user_id", rel_data["user_b_id"]) \
        .eq("relationship_id", relationship_id) \
        .eq("used_in_contest", False) \
        .execute()
    
    # Create the contest
    num_questions = 5 if contest_type == "weekly" else 3
    time_limit = 10 if contest_type == "weekly" else 5
    
    contest = db.table("contests").insert({
        "relationship_id": relationship_id,
        "contest_type": contest_type,
        "title": f"{'Weekly' if contest_type == 'weekly' else 'Daily'} Bond Challenge 💫",
        "description": f"How well do you know each other? Answer {num_questions} questions!",
        "scheduled_at": datetime.utcnow().isoformat(),
        "starts_at": datetime.utcnow().isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(minutes=time_limit)).isoformat(),
        "time_limit_minutes": time_limit,
        "status": "active",
        "max_points": num_questions * 10
    }).execute()
    
    if not contest.data:
        return {"error": "Failed to create contest"}
    
    contest_data = contest.data[0]
    
    # Generate questions
    questions = []
    used_categories = set()
    all_facts = (facts_a.data or []) + (facts_b.data or [])
    
    # First, create questions from actual chat facts
    for fact in all_facts[:num_questions]:
        about_user = fact["user_id"]
        about_name = name_a if about_user == rel_data["user_a_id"] else name_b
        
        template = next(
            (t for t in QUESTION_TEMPLATES if t["category"] == fact["fact_category"]),
            {"template": f"What did {about_name} mention about their {fact['fact_category']}?", "category": fact["fact_category"]}
        )
        
        question_text = template["template"].format(name=about_name)
        
        q = db.table("contest_questions").insert({
            "contest_id": contest_data["id"],
            "question_text": question_text,
            "question_type": "open",
            "question_about_user": about_user,
            "correct_answer": fact["fact_value"],
            "confidence_score": fact.get("confidence", 0.8),
            "points": 10,
            "question_order": len(questions)
        }).execute()
        
        if q.data:
            questions.append(q.data[0])
            used_categories.add(fact["fact_category"])
        
        # Mark fact as used
        db.table("chat_facts").update({"used_in_contest": True}).eq("id", fact["id"]).execute()
    
    # Fill remaining questions with templates (if not enough chat facts)
    remaining = num_questions - len(questions)
    if remaining > 0:
        available_templates = [t for t in QUESTION_TEMPLATES if t["category"] not in used_categories]
        random.shuffle(available_templates)
        
        for template in available_templates[:remaining]:
            about_user = random.choice([rel_data["user_a_id"], rel_data["user_b_id"]])
            about_name = name_a if about_user == rel_data["user_a_id"] else name_b
            
            q = db.table("contest_questions").insert({
                "contest_id": contest_data["id"],
                "question_text": template["template"].format(name=about_name),
                "question_type": "open",
                "question_about_user": about_user,
                "points": 10,
                "question_order": len(questions)
            }).execute()
            
            if q.data:
                questions.append(q.data[0])
    
    return {
        "contest": contest_data,
        "questions": questions,
        "time_limit_minutes": time_limit
    }


async def submit_answer(question_id: str, user_id: str, answer: str) -> dict:
    """Submit an answer for a contest question."""
    db = get_supabase()
    
    question = db.table("contest_questions").select("*").eq("id", question_id).execute()
    if not question.data or len(question.data) == 0:
        return {"error": "Question not found"}
    
    q_data = question.data[0]
    contest = db.table("contests").select("*").eq("id", q_data["contest_id"]).execute()
    if not contest.data or len(contest.data) == 0:
        return {"error": "Contest not found"}
    
    contest_data = contest.data[0]
    rel = db.table("relationships").select("*").eq("id", contest_data["relationship_id"]).execute()
    if not rel.data or len(rel.data) == 0:
        return {"error": "Relationship not found"}
    
    rel_data = rel.data[0]
    
    # Determine which user field to update
    is_user_a = user_id == rel_data["user_a_id"]
    answer_field = "user_a_answer" if is_user_a else "user_b_answer"
    time_field = "user_a_answered_at" if is_user_a else "user_b_answered_at"
    points_field = "user_a_points" if is_user_a else "user_b_points"
    
    # Score the answer
    points = 0
    correct = q_data.get("correct_answer", "").lower().strip()
    user_answer = answer.lower().strip()
    
    if correct and user_answer:
        if user_answer == correct:
            points = q_data["points"]  # Exact match
        elif correct in user_answer or user_answer in correct:
            points = q_data["points"] // 2  # Partial match
    
    # Update question
    db.table("contest_questions").update({
        answer_field: answer,
        time_field: datetime.utcnow().isoformat(),
        points_field: points
    }).eq("id", question_id).execute()
    
    return {
        "points_awarded": points,
        "is_correct": points == q_data["points"],
        "correct_answer": correct if correct else None
    }


async def complete_contest(contest_id: str) -> dict:
    """Complete a contest and award bond points."""
    db = get_supabase()
    
    contest = db.table("contests").select("*").eq("id", contest_id).execute()
    if not contest.data or len(contest.data) == 0:
        return {"error": "Contest not found"}
    
    contest_data = contest.data[0]
    
    questions = db.table("contest_questions") \
        .select("*") \
        .eq("contest_id", contest_id) \
        .order("question_order") \
        .execute()
    
    total_a = sum(q.get("user_a_points", 0) for q in (questions.data or []))
    total_b = sum(q.get("user_b_points", 0) for q in (questions.data or []))
    total = total_a + total_b
    
    # Check synchrony (both answered similarly)
    is_synchronized = total_a > 0 and total_b > 0 and abs(total_a - total_b) <= 10
    
    # Bonus for synchrony
    bond_points = total
    if is_synchronized:
        bond_points = int(bond_points * 1.5)
    
    # Update contest
    db.table("contests").update({
        "status": "completed",
        "user_a_score": total_a,
        "user_b_score": total_b,
        "total_score": total,
        "is_synchronized": is_synchronized,
        "bond_points_awarded": bond_points,
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", contest_id).execute()
    
    # Update relationship bond points
    rel_id = contest_data["relationship_id"]
    rel = db.table("relationships").select("bond_points, care_score, contests_completed, contests_won") \
        .eq("id", rel_id).execute()
    
    if rel.data and len(rel.data) > 0:
        rel_data = rel.data[0]
        new_bond = rel_data["bond_points"] + bond_points
        new_care = min(100, rel_data["care_score"] + (bond_points // 5))
        
        db.table("relationships").update({
            "bond_points": new_bond,
            "care_score": new_care,
            "contests_completed": rel_data["contests_completed"] + 1,
            "contests_won": rel_data["contests_won"] + (1 if total >= contest_data["max_points"] * 0.7 else 0)
        }).eq("id", rel_id).execute()
    
    return {
        "total_score": total,
        "user_a_score": total_a,
        "user_b_score": total_b,
        "is_synchronized": is_synchronized,
        "bond_points_awarded": bond_points,
        "passed": total >= contest_data["max_points"] * 0.5
    }
