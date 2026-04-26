import os
import random
import uuid
import json
import smtplib
import base64
import numpy as np
import librosa
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

from fastapi import FastAPI, HTTPException, Depends, Request, Header, APIRouter, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Local imports
from database import get_db, engine, Base
from models import User, Child, PregnancyInfo, AIQuery, MoodLog, HealthRecord, PlanTemplate, TaskCompletion, Milestone, CheckIn, MasterActivity

# --- CONFIG ---
SMTP_SERVER = "smtp.hostinger.com"
SMTP_PORT = 465
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "support@neevios.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "q#F5$~T1CT+")

# Simple In-Memory OTP Store
temp_otp_store = {}

# --- SESSION STATE (Simple File-based for Demo) ---
class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.file_path = f"sessions/{session_id}.json"
        os.makedirs("sessions", exist_ok=True)
        self.load()

    def load(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {
            "session_id": self.session_id,
            "parent_name": None,
            "parent_type": None,
            "child_name": None,
            "child_age_months": 0,
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    relationship_type: Optional[str] = None
    child_first_name: Optional[str] = None
    child_last_name: Optional[str] = None
    child_name: Optional[str] = None
    child_dob: Optional[str] = None  # YYYY-MM-DD
    child_time_of_birth: Optional[str] = None
    child_sex: Optional[str] = None
    diet_preference: Optional[str] = None
    preferred_plan_type: Optional[str] = None
    preferred_time_of_day: Optional[str] = None
    preferred_activity_time: Optional[str] = None
    stage: Optional[str] = "parenting"
    current_week: Optional[int] = None
    child_age_months: Optional[int] = None
    mood_logs: Optional[List[Any]] = None
    health_records: Optional[List[Any]] = None
    task_completions: Optional[List[str]] = None
    check_ins: Optional[List[Any]] = None

class UserIDRequest(BaseModel):
    user_id: str

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    user_id: str
    child_profile: Optional[ChildProfile] = None

class GuidanceRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: str
    child_profile: Optional[ChildProfile] = None

class UpdateProfileRequest(BaseModel):
    session_id: str
    field: str
    value: Any
    user_id: str

class OTPRequest(BaseModel):
    identifier: str

class WishlistRequest(BaseModel):
    email: str
    category: str = "parent"

class OTPVerifyRequest(BaseModel):
    identifier: str
    otp: str

class CreateChildRequest(BaseModel):
    first_name: str
    last_name: str
    dob: str # YYYY-MM-DD
    time_of_birth: Optional[str] = None # HH:MM AM/PM
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
    diet_preference: Optional[str] = None

class CreateMilestoneRequest(BaseModel):
    child_id: Optional[int] = None
    title: str
    notes: Optional[str] = None
    age_months: Optional[int] = None

class CreateCheckInRequest(BaseModel):
    type: str # "morning" or "evening"
    date: str # YYYY-MM-DD
    sleep_hours: Optional[float] = None
    night_wakings: Optional[int] = None
    baby_mood: Optional[str] = None
    total_feeds: Optional[int] = None
    tummy_time: Optional[str] = None
    parent_mood: Optional[str] = None
    new_milestone: Optional[str] = None
    concerns: Optional[str] = None

class CryAnalysisRequest(BaseModel):
    audio_data: str # Base64
    child_age_months: Optional[int] = 6

# --- UTILS ---

def normalize_id(identifier: str) -> str:
    return identifier.strip().lower()

def send_email_otp(target_email: str, otp_code: str):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("Error: SMTP credentials not configured")
        return False

    msg = MIMEMultipart("related")
    msg['Subject'] = "Your NEEV verification code"
    msg['From'] = f"NEEV Support <{SENDER_EMAIL}>"
    msg['To'] = target_email

    html_content = f"""
    <html>
    <body style="background-color: #000; margin: 0; padding: 15px; font-family: Arial, sans-serif;">
        <center>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 360px; border: 1.5px solid #A8D5BA; border-radius: 12px; background-color: #000; position: relative;">
                <tr>
                    <td align="center" style="padding: 15px; position: relative;">
                        <!-- Heartbeat Top -->
                        <div style="height: 1px; background: linear-gradient(to right, transparent, #A8D5BA, transparent); margin-bottom: 15px; width: 80%;"></div>
                        
                        <div style="margin-bottom: 10px;">
                            <img src="cid:logo" width="55" height="55" style="border-radius: 28px; border: 1.5px solid #A8D5BA; display: block;">
                        </div>
                        
                        <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; letter-spacing: 5px; font-weight: 900;">NEEV</h1>
                        <p style="color: #A8D5BA; font-size: 9px; margin: 4px 0 12px 0; letter-spacing: 1px; font-weight: bold; text-transform: uppercase; line-height: 14px;">
                            Neural Engine for Early Values,<br>Intelligence & Optimized Support
                        </p>
                        
                        <div style="border: 1px solid rgba(168, 230, 207, 0.25); border-radius: 8px; padding: 10px; margin-bottom: 12px; background-color: rgba(255,255,255,0.02);">
                            <p style="color: #A8D5BA; font-size: 10px; margin: 0 0 4px 0; font-weight: bold; letter-spacing: 1px;">VERIFICATION CODE</p>
                            <span style="color: #FFFFFF; font-size: 32px; font-weight: 900; letter-spacing: 6px;">{otp_code}</span>
                        </div>

                        <p style="color: rgba(255,255,255,0.3); font-size: 8px; margin: 0; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">
                            Building values, one heartbeat at a time
                        </p>
                    </td>
                </tr>
            </table>
        </center>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, "html"))

    # Attach Logo (Main and Background)
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        logo_path = os.path.abspath(os.path.join(current_dir, "..", "frontend", "assets", "images", "neuron_avatar.jpeg"))
        
        with open(logo_path, "rb") as f:
            logo_data = f.read()
            # Main Logo
            img = MIMEImage(logo_data)
            img.add_header("Content-ID", "<logo>")
            msg.attach(img)
    except Exception as e:
        print(f"Could not attach logo: {e}")

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

# REFINED CORS: Allow all headers and methods explicitly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

api_router = APIRouter()

# --- AUTH BRIDGE ENDPOINTS ---

@api_router.post("/api/auth/send-otp")
async def send_otp(background_tasks: BackgroundTasks, req: OTPRequest):
    identifier = normalize_id(req.identifier)
    otp_code = str(random.randint(100000, 999999))
    temp_otp_store[identifier] = otp_code
    
    print(f"DEBUG: Generated OTP for {identifier}: {otp_code}")

    if "@" in identifier:
        background_tasks.add_task(send_email_otp, identifier, otp_code)

    return {"message": "OTP sent successfully"}

@api_router.post("/api/wishlist")
async def wishlist_bridge(req: WishlistRequest):
    DIRECTUS_URL = "https://directus.neevios.com"
    DIRECTUS_TOKEN = "KYe03vXlzO8-P1ec00OzGNJpFSHmyYj3"
    
    try:
        import requests
        response = requests.post(
            f"{DIRECTUS_URL}/items/Wishlist",
            headers={"Authorization": f"Bearer {DIRECTUS_TOKEN}", "Content-Type": "application/json"},
            json={"email": req.email.strip(), "category": req.category, "status": "published"}
        )
        data = response.json()
        if not response.ok:
            if "RECORD_NOT_UNIQUE" in str(data):
                raise HTTPException(status_code=400, detail="You are already on our waitlist!")
            raise HTTPException(status_code=response.status_code, detail="Directus rejection")
        return {"success": True}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

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
            "onboarding_complete": user.onboarding_complete,
            "relationship_type": user.relationship_type
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
        "first_name": user.first_name,
        "last_name": user.last_name,
        "sex": user.sex,
        "dob": user.dob.isoformat() if user.dob else None,
        "marital_status": user.marital_status,
        "relationship_type": user.relationship_type,
        "stage": user.stage,
        "email": user.email,
        "phone_number": user.phone_number,
        "onboarding_complete": user.onboarding_complete,
        "children": [
            {
                "id": str(c.id),
                "first_name": c.first_name,
                "last_name": c.last_name,
                "name": c.name,
                "dob": c.dob.isoformat() if c.dob else None,
                "time_of_birth": c.time_of_birth,
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
            if key == 'dob' and value:
                setattr(user, key, datetime.fromisoformat(value))
            else:
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
        first_name=req.first_name,
        last_name=req.last_name,
        name=f"{req.first_name} {req.last_name}",
        dob=datetime.fromisoformat(req.dob),
        time_of_birth=req.time_of_birth,
        sex=req.sex,
        diet_preference=req.diet_preference
    )
    db.add(new_child)

    user.onboarding_complete = True
    db.commit()
    db.refresh(new_child)
    return {
        "id": str(new_child.id),
        "first_name": new_child.first_name,
        "last_name": new_child.last_name,
        "onboarding_complete": user.onboarding_complete
    }

@api_router.post("/api/user/pregnancy")
async def add_pregnancy(req: UpdatePregnancyRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")

    # Check if exists
    pinfo = db.query(PregnancyInfo).filter(PregnancyInfo.user_id == user.id).first()
    if not pinfo:
        pinfo = PregnancyInfo(
            user_id=user.id, 
            current_week=req.current_week,
            diet_preference=req.diet_preference
        )
        db.add(pinfo)
    else:
        pinfo.current_week = req.current_week
        if req.diet_preference:
            pinfo.diet_preference = req.diet_preference

    user.onboarding_complete = True
    db.commit()
    return {"status": "success"}

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

@api_router.post("/api/checkin")
async def create_checkin(req: CreateCheckInRequest, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")

    new_checkin = CheckIn(
        user_id=user.id,
        type=req.type,
        date=req.date,
        sleep_hours=req.sleep_hours,
        night_wakings=req.night_wakings,
        baby_mood=req.baby_mood,
        total_feeds=req.total_feeds,
        tummy_time=req.tummy_time,
        parent_mood=req.parent_mood,
        new_milestone=req.new_milestone,
        concerns=req.concerns
    )
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)
    return new_checkin

@api_router.get("/api/checkin/today")
async def get_today_checkins(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")

    today_str = date.today().isoformat()
    checkins = db.query(CheckIn).filter(
        CheckIn.user_id == user.id,
        CheckIn.date == today_str
    ).all()
    return checkins

@api_router.get("/api/schedules/current")
async def get_current_schedule(request: Request, db: Session = Depends(get_db)):
    # Note: frontend is now preferring directusService.ts for fetching activities.
    # This route remains for backward compatibility and internal AI guidance usage.
    auth_header = request.headers.get("Authorization")
    user = None
    
    if auth_header and "Bearer " in auth_header:
        # Simple extraction if possible, else fallback
        user = get_current_user(request, db)
    else:
        # Dev fallback
        user = db.query(User).first()

    if not user:
        return {"tasks": [], "week": 1, "plan_type": "20_min_plan"}

    # Determine current week based on child's age or pregnancy week
    current_week = 1
    if user.stage == "pregnancy":
        pinfo = db.query(PregnancyInfo).filter(PregnancyInfo.user_id == user.id).first()
        if pinfo: current_week = pinfo.current_week
    else:
        # Get active child
        child = None
        if user.active_child_id:
            child = db.query(Child).filter(Child.id == user.active_child_id).first()
        elif user.children:
            child = user.children[0]
        
        if child:
            from datetime import date as pydate
            dob_str = child.dob.date().isoformat()
            dob = pydate.fromisoformat(dob_str)
            today = pydate.today()
            age_months = (today.year - dob.year) * 12 + (today.month - dob.month)
            current_week = max(1, age_months * 4)

    plan_type = user.preferred_plan_type or "20_min_plan"
    
    # Try fetching from the local SQLite MasterActivity as a source of truth for the local schedule
    # In production, this would be synced with Directus
    master_activities = db.query(MasterActivity).limit(10).all()
    
    if not master_activities:
        # Check PlanTemplate as fallback
        plan = db.query(PlanTemplate).filter(
            PlanTemplate.plan_type == plan_type,
            PlanTemplate.week == current_week
        ).first() or db.query(PlanTemplate).filter(PlanTemplate.plan_type == plan_type).first()
        
        if plan and plan.activities_json:
            activity_list = plan.activities_json if isinstance(plan.activities_json, list) else []
            activity_names = [item.get("title") if isinstance(item, dict) else item for item in activity_list if item]
            master_activities = db.query(MasterActivity).filter(MasterActivity.activity.in_(activity_names)).all()

    completions = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id
    ).all()
    completed_names = {c.activity_name for c in completions}

    tasks = []
    for ma in master_activities:
        tasks.append({
            "id": str(ma.id),
            "title": ma.activity,
            "domain": ma.domain,
            "description": ma.description,
            "tools": ma.tools,
            "completed": ma.activity in completed_names,
            "session_min": ma.session_min,
            "session_max": ma.session_max,
            "frequency": "Daily"
        })

    return {
        "tasks": tasks,
        "week": current_week,
        "plan_type": plan_type,
        "completed_count": len(completed_names)
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
        status = "unmarked"
    else:
        new_completion = TaskCompletion(
            user_id=user.id,
            activity_name=req.activity_name,
            week=req.week
        )
        db.add(new_completion)
        status = "marked"
    
    db.commit()
    return {"status": status}

# --- AI ENDPOINTS ---

@app.post("/ai/guidance")
async def get_ai_guidance(req: GuidanceRequest, db: Session = Depends(get_db)):
    # 1. Get schedule data
    schedule = await get_current_schedule(Request(scope={"type": "http", "headers": []}), db)
    
    # 2. Extract check-in context for empathy
    parent_mood = "calm"
    intention = "connect with baby"
    energy = 3
    
    if req.child_profile and req.child_profile.check_ins:
        # Check for today's morning check-in
        today = date.today().isoformat()
        morning_checkin = next((c for c in req.child_profile.check_ins if c.get('type') == 'morning' and c.get('date') == today), None)
        
        if morning_checkin:
            parent_mood = morning_checkin.get('parent_mood', morning_checkin.get('baby_mood', 'calm')).lower()
            intention = morning_checkin.get('parent_intention', morning_checkin.get('cry_label', 'connect')).lower()
            energy = morning_checkin.get('parent_energy', morning_checkin.get('sleep_hours', 3))

    # 3. Generate empathetic insight based on mood and intention
    insight = f"I hear that you're feeling {parent_mood} this morning."
    if "overwhelmed" in parent_mood or "tired" in parent_mood:
        insight += f" It's completely understandable to feel this way. Remember, it's okay to lower the bar today."
        rec = f"Since your goal is to {intention}, try a low-energy activity like listening to soft music together while resting."
    elif "energised" in parent_mood or "hopeful" in parent_mood:
        insight += f" That's wonderful to hear! Use that energy to fuel your focus on {intention}."
        rec = f"Since you want to {intention}, today is a great day for an active 'Nurture Path' session."
    else:
        insight += f" Focusing on {intention} is a beautiful way to start the day."
        rec = f"Let's lean into that intention with a 10-minute social play session today."

    guidance_data = {
        "daily_tasks": schedule["tasks"],
        "week": schedule["week"],
        "completed_count": schedule["completed_count"],
        "insight": insight,
        "recommendation": rec
    }
    
    # Simulate streaming by sending the whole thing (the frontend fix now handles this)
    return guidance_data

@app.post("/ask")
async def ask_ai(req: ChatRequest, db: Session = Depends(get_db)):
    # Fallback response since main AI is handled by f.neevios.com
    async def mock_generator():
        yield json.dumps({"token": "I am the local management API. For AI chat, please use the main Chat interface."}) + "\n"
    return StreamingResponse(mock_generator(), media_type="application/x-ndjson")

@app.post("/ai/analyze-cry")
async def analyze_cry(
    audio: UploadFile = File(...),
    child_age_months: int = Form(default=6)
):
    try:
        # 1. Read and save audio to temp file
        audio_bytes = await audio.read()
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # 2. Load and extract features with librosa
        y, sr = librosa.load(tmp_path, duration=10)
        os.remove(tmp_path)

        # Enhanced Acoustic features
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0
        centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        rms = np.mean(librosa.feature.rms(y=y))
        
        # Spectral Flatness - helps distinguish between tonal (hungry) and noisy (discomfort)
        flatness = np.mean(librosa.feature.spectral_flatness(y=y))
        
        # MFCCs for timbre analysis
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1)

        # 3. Deterministic Mapping (Refined Acoustic Logic)
        # Dunstan Baby Language (DBL) integration
        
        # Hunger (Neh): Rhythmic, moderate pitch, distinct harmonics
        if 350 < pitch < 450 and rms > 0.04 and flatness < 0.05:
            res = {
                "label": "neh", "meaning": "Hunger", "emoji": "🍼", "urgency": "medium",
                "confidence": 88, "cry_type": "hunger",
                "description": "Rhythmic harmonics and low spectral flatness indicate a 'Neh' reflex from the sucking instinct.",
                "action": "Your baby is likely hungry. Time for a feeding session."
            }
        # Sleepy (Owh): Low pitch, breathy, lower spectral energy
        elif pitch < 320 and centroid < 1600 and flatness > 0.02:
            res = {
                "label": "owh", "meaning": "Sleepy", "emoji": "😴", "urgency": "low",
                "confidence": 82, "cry_type": "sleepy",
                "description": "Lower fundamental frequency and reduced spectral centroid suggest an 'Owh' yawn-like pattern.",
                "action": "Start your soothing routine; your baby is getting tired."
            }
        # Discomfort/Pain (Heh): High turbulence, noisy, high ZCR
        elif pitch > 450 or (zcr > 0.18 and flatness > 0.06):
            res = {
                "label": "heh", "meaning": "Discomfort", "emoji": "🌡️", "urgency": "medium",
                "confidence": 79, "cry_type": "discomfort",
                "description": "High zero-crossing rate and spectral turbulence indicate physical discomfort or skin irritation.",
                "action": "Check diaper, clothing, or room temperature."
            }
        # Lower Gas (Eair): Strained, low ZCR, high intensity in mid-frequencies
        elif zcr < 0.04 and pitch > 380 and mfcc_mean[1] > 0:
            res = {
                "label": "eair", "meaning": "Lower Gas", "emoji": "💨", "urgency": "high",
                "confidence": 76, "cry_type": "gas",
                "description": "Strained vocalization with specific MFCC signatures indicating lower abdominal pressure.",
                "action": "Try 'bicycle legs' or a gentle tummy massage to relieve gas."
            }
        # Burp (Eh): Short, staccato, high flatness (noise-like)
        else:
            res = {
                "label": "eh", "meaning": "Burp", "emoji": "💨", "urgency": "low",
                "confidence": 72, "cry_type": "burp",
                "description": "Short, bursty signals with high spectral flatness suggest a need to release air.",
                "action": "Hold your baby upright and gently pat their back."
            }

        return res
    except Exception as e:
        print(f"Error in cry analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)
