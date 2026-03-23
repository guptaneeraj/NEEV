from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import os
import json
import uuid
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timezone, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import asyncio

# Load Environment Variables
from dotenv import load_dotenv
load_dotenv()

from database import get_db, SessionLocal, engine, Base
from models import User, Child, MasterActivity, PlanTemplate, MoodLog, HealthRecord, TaskCompletion, Milestone

# Create tables automatically on startup
Base.metadata.create_all(bind=engine)

# Constants
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CONVERSATIONS_DIR = os.path.join(DATA_DIR, "conversations")
VECTOR_DB_DIR = os.path.join(DATA_DIR, "vector_db")

# Hostinger SMTP Settings (Read from env/web.config)
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "support@neevios.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "q#F5$~T1CT+")
SMTP_SERVER = "smtp.hostinger.com"
SMTP_PORT = 465

for d in [DATA_DIR, CONVERSATIONS_DIR, VECTOR_DB_DIR]:
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

PARENT_TYPES = [
    "Mother", "Father", "Grandmother", "Grandfather", "Guardian", "Caregiver",
    "Aunt", "Uncle", "Foster Parent", "Adoptive Parent", "Stepmother", "Stepfather"
]

# In-memory OTP storage: { "identifier": "code" }
temp_otp_store = {}

# --- SESSION MANAGEMENT ---

class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.file_path = os.path.join(CONVERSATIONS_DIR, f"{session_id}.json")
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as f:
                return json.load(f)
        return {
            "parent_name": None,
            "parent_type": None,
            "child_name": None,
            "child_age_months": None,
            "child_sex": None,
            "child_diet": None,
            "is_anonymous": False,
            "child_is_anonymous": False,
            "onboarding_complete": False,
            "pending_edit_field": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "messages": [],
            "child_profile_ext": {} # Store extra profile data
        }

    def save(self):
        with open(self.file_path, 'w') as f:
            json.dump(self.data, f, indent=2)

# --- REQUEST MODELS ---

class ChildProfile(BaseModel):
    full_name: Optional[str] = None
    relationship_type: Optional[str] = None
    child_name: Optional[str] = None
    child_dob: Optional[str] = None  # YYYY-MM-DD
    child_sex: Optional[str] = None
    diet_preference: Optional[str] = None
    preferred_plan_type: Optional[str] = None
    preferred_time_of_day: Optional[str] = None
    preferred_activity_time: Optional[str] = None
    stage: Optional[str] = "parenting"
    current_week: Optional[int] = None
    mood_logs: Optional[List[Any]] = []
    health_records: Optional[List[Any]] = []
    task_completions: Optional[List[str]] = []

class UserIDRequest(BaseModel):
    user_id: str

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    user_id: str
    child_profile: Optional[ChildProfile] = None

class GuidanceRequest(BaseModel):
    session_id: str
    user_id: str
    child_profile: Optional[ChildProfile] = None

class UpdateProfileRequest(BaseModel):
    session_id: str
    field: str
    value: Any
    user_id: str

class OTPRequest(BaseModel):
    identifier: str

class OTPVerifyRequest(BaseModel):
    identifier: str
    otp: str

class CreateChildRequest(BaseModel):
    name: str
    dob: str # YYYY-MM-DD
    sex: Optional[str] = None
    diet_preference: Optional[str] = None

class CreateMoodLogRequest(BaseModel):
    mood: str
    notes: Optional[str] = None
    date: Optional[str] = None

class CreateHealthRecordRequest(BaseModel):
    record_type: str
    value: str
    unit: Optional[str] = None
    date: str
    notes: Optional[str] = None

class ToggleTaskRequest(BaseModel):
    activity_name: str
    week: int

class UpdatePregnancyRequest(BaseModel):
    current_week: int
    due_date: Optional[str] = None
    is_user_pregnant: bool = True

class CreateMilestoneRequest(BaseModel):
    child_id: Optional[int] = None
    title: str
    notes: Optional[str] = None
    age_months: Optional[int] = None

# --- UTILS ---

def normalize_id(identifier: str) -> str:
    return identifier.strip().lower()

def send_email_otp(target_email: str, otp_code: str):
    msg = MIMEText(f"Your NEEV verification code is: {otp_code}")
    msg['Subject'] = "Your NEEV verification code"
    msg['From'] = SENDER_EMAIL
    msg['To'] = target_email

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, target_email, msg.as_string())
        print(f"OTP email sent to {target_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def calculate_age_months(dob_str: str) -> int:
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return (today.year - dob.year) * 12 + today.month - dob.month
    except:
        return 0

def update_session_from_profile(state: SessionState, profile: ChildProfile):
    if profile.full_name:
        state.data["parent_name"] = profile.full_name
        if profile.full_name == "Anonymous":
            state.data["is_anonymous"] = True
    if profile.relationship_type:
        state.data["parent_type"] = profile.relationship_type
    if profile.child_name:
        state.data["child_name"] = profile.child_name
        if profile.child_name == "Private":
            state.data["child_is_anonymous"] = True
    if profile.child_dob:
        state.data["child_age_months"] = calculate_age_months(profile.child_dob)
    if profile.child_sex:
        state.data["child_sex"] = profile.child_sex
    if profile.diet_preference:
        state.data["child_diet"] = profile.diet_preference
    
    # Store extended data
    state.data["child_profile_ext"] = profile.model_dump()
    
    # Mark onboarding complete if basic info is present
    if profile.child_name and profile.child_dob and profile.relationship_type:
        state.data["onboarding_complete"] = True
    
    state.save()

def get_current_user(request: Request, db: Session):
    auth_header = request.headers.get("Authorization")
    if auth_header and "Bearer mock-token-" in auth_header:
        try:
            parts = auth_header.split("-")
            if len(parts) >= 3:
                extracted_id = int(parts[2])
                return db.query(User).filter(User.id == extracted_id).first()
        except:
            pass
    return db.query(User).first() # Fallback for dev

# --- API ---

app = FastAPI(title="Neev AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"]
)

api_router = APIRouter()

# --- AUTH BRIDGE ENDPOINTS ---

@api_router.post("/api/auth/send-otp")
async def send_otp(req: OTPRequest):
    identifier = normalize_id(req.identifier)
    otp_code = str(random.randint(100000, 999999))
    temp_otp_store[identifier] = otp_code

    if "@" in identifier:
        send_email_otp(identifier, otp_code)

    print(f"\n[AUTH] OTP for {identifier}: {otp_code}\n")
    return {"message": "OTP sent successfully"}

@api_router.post("/api/auth/verify-otp")
async def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    identifier = normalize_id(req.identifier)
    stored_otp = temp_otp_store.get(identifier)

    print(f"DEBUG: Verifying OTP for '{identifier}'. Provided: '{req.otp}', Stored: '{stored_otp}'")

    if stored_otp and req.otp == stored_otp:
        del temp_otp_store[identifier]
        
        user = db.query(User).filter(
            (User.email == identifier) | (User.phone_number == identifier)
        ).first()

        if not user:
            user = User(
                email=identifier if "@" in identifier else None,
                phone_number=identifier if "@" not in identifier else None,
                hashed_password="social_auth_placeholder",
                full_name="New User",
                onboarding_complete=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return {
            "access_token": f"mock-token-{user.id}-{uuid.uuid4()}",
            "user_id": str(user.id),
            "onboarding_complete": user.onboarding_complete
        }
    
    if not stored_otp:
         raise HTTPException(status_code=400, detail=f"No OTP found for {identifier}. Please request a new one.")

    raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code and try again.")

@api_router.get("/api/user/profile")
async def get_profile(request: Request, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    user = None
    if user_id:
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = get_current_user(request, db)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "relationship_type": user.relationship_type,
        "stage": user.stage,
        "email": user.email,
        "phone_number": user.phone_number,
        "onboarding_complete": user.onboarding_complete,
        "children": [
            {
                "id": str(c.id),
                "name": c.name,
                "dob": c.dob.isoformat() if c.dob else None,
                "sex": c.sex,
                "diet_preference": c.diet_preference,
                "age_months": calculate_age_months(c.dob.date().isoformat()) if c.dob else 0
            } for c in user.children
        ]
    }

@api_router.patch("/api/user/update")
async def update_user(request: Request, update_data: Dict[str, Any], db: Session = Depends(get_db)):
    user = get_current_user(request, db)
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    for key, value in update_data.items():
        if hasattr(user, key):
            setattr(user, key, value)
            
    db.commit()
    db.refresh(user)
    return {
        "status": "success",
        "user": {
            "id": str(user.id),
            "full_name": user.full_name,
            "onboarding_complete": user.onboarding_complete
        }
    }

@api_router.post("/api/user/child")
async def add_child(req: CreateChildRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    new_child = Child(
        user_id=user.id,
        name=req.name,
        dob=datetime.fromisoformat(req.dob),
        sex=req.sex,
        diet_preference=req.diet_preference
    )
    db.add(new_child)
    
    user.onboarding_complete = True 
    db.commit()
    db.refresh(new_child)
    return {
        "id": str(new_child.id),
        "name": new_child.name,
        "onboarding_complete": user.onboarding_complete
    }

@api_router.get("/api/mood/logs")
async def get_mood_logs(request: Request, days: int = 30, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    logs = db.query(MoodLog).filter(MoodLog.user_id == user.id).order_by(MoodLog.date.desc()).limit(days).all()
    return logs

@api_router.post("/api/mood/log")
async def log_mood(req: CreateMoodLogRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    log_date = datetime.fromisoformat(req.date) if req.date else datetime.now(timezone.utc)
    new_log = MoodLog(
        user_id=user.id,
        mood=req.mood,
        notes=req.notes,
        date=log_date
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@api_router.get("/api/health/records")
async def get_health_records(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    records = db.query(HealthRecord).filter(HealthRecord.user_id == user.id).order_by(HealthRecord.date.desc()).all()
    return records

@api_router.post("/api/health/record")
async def add_health_record(req: CreateHealthRecordRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    new_record = HealthRecord(
        user_id=user.id,
        record_type=req.record_type,
        value=req.value,
        unit=req.unit,
        date=datetime.fromisoformat(req.date),
        notes=req.notes
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@api_router.get("/api/schedules/current")
async def get_current_schedule(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    plan = db.query(PlanTemplate).filter(PlanTemplate.plan_type == (user.preferred_plan_type or "20_min_plan")).first()
    
    if not plan:
        return {"needs_plan": True}
        
    completions = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id,
        TaskCompletion.week == plan.week
    ).all()
    completed_names = {c.activity_name for c in completions}
    
    tasks = []
    for activity in plan.activities_json:
        tasks.append({
            "title": activity["title"],
            "completed": activity["title"] in completed_names
        })
        
    return {
        "week": plan.week,
        "plan_type": plan.plan_type,
        "time_preference": user.preferred_activity_time or "Not set",
        "tasks": tasks
    }

@api_router.post("/api/tasks/toggle")
async def toggle_task(req: ToggleTaskRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    existing = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id,
        TaskCompletion.activity_name == req.activity_name,
        TaskCompletion.week == req.week
    ).first()
    
    if existing:
        db.delete(existing)
        status = "incomplete"
    else:
        new_completion = TaskCompletion(
            user_id=user.id,
            activity_name=req.activity_name,
            week=req.week,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(new_completion)
        status = "complete"
        
    db.commit()
    return {"status": status}

@api_router.get("/api/milestones/streak")
async def get_streak(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Get all unique completion dates for this user, sorted descending
    completions = db.query(TaskCompletion.completed_at)\
        .filter(TaskCompletion.user_id == user.id)\
        .order_by(TaskCompletion.completed_at.desc())\
        .all()
    
    if not completions:
        return {"current_streak": 0, "best_streak": 0}

    # Convert to set of date objects to handle multiple tasks on same day
    completion_dates = sorted({c.completed_at.date() for c in completions}, reverse=True)
    
    today = date.today()
    current_streak = 0
    
    # Calculate current streak
    # Check if the most recent completion was today or yesterday
    if completion_dates[0] >= today - timedelta(days=1):
        temp_date = completion_dates[0]
        current_streak = 1
        for i in range(1, len(completion_dates)):
            if completion_dates[i] == temp_date - timedelta(days=1):
                current_streak += 1
                temp_date = completion_dates[i]
            else:
                break
    
    # Calculate best streak
    best_streak = 0
    if completion_dates:
        temp_streak = 1
        best_streak = 1
        for i in range(1, len(completion_dates)):
            if completion_dates[i] == completion_dates[i-1] - timedelta(days=1):
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
        best_streak = max(best_streak, temp_streak)

    return {
        "current_streak": current_streak,
        "best_streak": best_streak
    }

@api_router.post("/api/pregnancy/update")
async def update_pregnancy(req: UpdatePregnancyRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    preg_info = user.pregnancy_info
    if not preg_info:
        from models import PregnancyInfo
        preg_info = PregnancyInfo(user_id=user.id)
        db.add(preg_info)
    
    preg_info.current_week = req.current_week
    preg_info.is_user_pregnant = req.is_user_pregnant
    if req.due_date:
        preg_info.due_date = datetime.fromisoformat(req.due_date)
    
    db.commit()
    db.refresh(preg_info)
    return preg_info

@api_router.post("/api/milestones/log")
async def log_milestone(req: CreateMilestoneRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    new_milestone = Milestone(
        user_id=user.id,
        child_id=req.child_id,
        title=req.title,
        notes=req.notes,
        age_months=req.age_months
    )
    db.add(new_milestone)
    db.commit()
    db.refresh(new_milestone)
    return new_milestone

@api_router.get("/api/milestones")
async def get_milestones(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    return db.query(Milestone).filter(Milestone.user_id == user.id).all()

# --- NEEV AI DATA CONTRACT ENDPOINTS (ai.neevios.com) ---

@api_router.post("/children/list")
async def list_children(req: UserIDRequest, db: Session = Depends(get_db)):
    results = []

    try:
        user_id_int = int(req.user_id)
        db_children = db.query(Child).filter(Child.user_id == user_id_int).all()
        for c in db_children:
            results.append({
                "session_id": f"sql-{c.id}",
                "child_name": c.name,
                "child_age_months": calculate_age_months(c.dob.date().isoformat()) if c.dob else 0,
                "child_sex": c.sex or "Male",
                "parent_name": "Parent",
                "parent_type": "Mother",
                "started_at": datetime.now(timezone.utc).isoformat()
            })
    except ValueError:
        pass

    if os.path.exists(CONVERSATIONS_DIR):
        for filename in os.listdir(CONVERSATIONS_DIR):
            if filename.endswith(".json"):
                session_id = filename.replace(".json", "")
                state = SessionState(session_id)
                if state.data.get("child_name"):
                    results.append({
                        "session_id": session_id,
                        "child_name": state.data["child_name"],
                        "child_age_months": state.data["child_age_months"],
                        "child_sex": state.data["child_sex"],
                        "parent_name": state.data["parent_name"],
                        "parent_type": state.data["parent_type"],
                        "started_at": state.data["started_at"]
                    })

    return {"children": results}

@api_router.post("/ai/ask")
async def ai_ask(req: ChatRequest, response: Response):
    session_id = req.session_id
    if not session_id:
        session_id = str(uuid.uuid4())

    state = SessionState(session_id)
    response.headers["X-Session-ID"] = session_id

    # Sync profile if provided
    if req.child_profile:
        update_session_from_profile(state, req.child_profile)

    async def event_generator():
        # Handle Onboarding Flow
        if not state.data["onboarding_complete"]:
            yield await handle_onboarding(state, req.question)
            return

        # Normal Chat Logic
        if req.question != "start":
            state.data["messages"].append({
                "role": "user",
                "content": req.question,
                "time": datetime.now(timezone.utc).isoformat()
            })

        # Personalize based on profile
        name = state.data.get("child_name") or "your child"
        age = state.data.get("child_age_months") or "some"

        full_answer = f"Hello! Regarding {name} ({age} months), you asked: {req.question}"
        if req.question == "start":
            full_answer = f"Welcome back! How can I help with {name} today?"

        for token in full_answer.split():
            yield json.dumps({"token": token + " "}) + "\n"
            await asyncio.sleep(0.05)

        state.data["messages"].append({
            "role": "assistant",
            "content": full_answer,
            "time": datetime.now(timezone.utc).isoformat()
        })
        state.save()
        yield json.dumps({"done": True}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

async def handle_onboarding(state: SessionState, question: str) -> str:
    steps = ["parent_name", "parent_type", "child_name", "child_age_months", "child_sex", "child_diet"]

    current_step_idx = 0
    for i, field in enumerate(steps):
        if state.data[field] is None:
            current_step_idx = i
            break
        else:
            current_step_idx = i + 1

    if question != "start" and current_step_idx < len(steps):
        field_to_save = steps[current_step_idx]
        state.data[field_to_save] = question
        state.save()
        current_step_idx += 1

    if current_step_idx >= len(steps):
        state.data["onboarding_complete"] = True
        state.save()
        return json.dumps({
            "answer": f"All set! Ready to help with {state.data['child_name']}.",
            "needs_onboarding": False,
            "onboarding_complete": True,
            "profile": state.data
        }) + "\n"

    field = steps[current_step_idx]
    prompts = {
        "parent_name": ("What is your name?", "parent_name", []),
        "parent_type": ("What is your relationship to the child?", "parent_type", PARENT_TYPES),
        "child_name": ("What is your child's name?", "child_name", []),
        "child_age_months": ("How old is your child in months?", "child_age", list(range(37))),
        "child_sex": ("What is your child's sex?", "child_sex", ["Male", "Female", "Prefer not to say"]),
        "child_diet": ("What is your child's diet?", "child_diet", ["Vegetarian", "Non-Vegetarian", "Eggetarian"])
    }

    answer_text, options_type, options = prompts[field]

    return json.dumps({
        "answer": answer_text,
        "needs_onboarding": True,
        "show_options": len(options) > 0 or options_type in ["parent_name", "child_name"],
        "options_type": options_type,
        "options": options,
        "step": current_step_idx + 1,
        "total_steps": 6
    }) + "\n"

@api_router.post("/ai/guidance")
async def ai_guidance(req: GuidanceRequest, db: Session = Depends(get_db)):
    state = SessionState(req.session_id)

    # Sync profile if provided
    if req.child_profile:
        update_session_from_profile(state, req.child_profile)

    if not state.data["onboarding_complete"]:
        return {
            "mode": "onboarding",
            "message": "No child profile found."
        }

    activities = db.query(MasterActivity).limit(2).all()
    tasks = []
    for a in activities:
        tasks.append({
            "title": a.activity,
            "reason": a.description[:50],
            "priority": random.choice(["high", "medium", "low"])
        })

    return {
        "session_id": req.session_id,
        "daily_tasks": tasks,
        "insight": f"{state.data.get('child_name', 'Your child')} is doing well with milestones.",
        "recommendation": "Try reading for 10 minutes today.",
        "alert": False
    }

@api_router.post("/update-profile")
async def update_profile(req: UpdateProfileRequest):
    state = SessionState(req.session_id)
    state.data[req.field] = req.value
    state.save()
    return {
        "success": True,
        "field": req.field,
        "profile": state.data
    }

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
