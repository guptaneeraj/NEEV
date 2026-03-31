import os
import random
import uuid
import json
import smtplib
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

from fastapi import FastAPI, HTTPException, Depends, Request, Header, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Local imports
from database import get_db, engine, Base
from models import User, Child, PregnancyInfo, AIQuery, MoodLog, HealthRecord, PlanTemplate, TaskCompletion, Milestone, CheckIn

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
    # Implementation for fetching tasks...
    return tasks

app.include_router(api_router)
