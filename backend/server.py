from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import httpx
from dateutil.relativedelta import relativedelta

from database import engine, get_db, Base
from models import User, Child, PregnancyInfo, ScheduleTemplate, TaskCompletion, AIQuery

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create database tables
Base.metadata.create_all(bind=engine)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# AI endpoint
AI_URL = os.getenv("AI_URL", "http://localhost:81/ask")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===== Pydantic Models =====
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    stage: str  # 'pregnancy' or 'child'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChildCreate(BaseModel):
    name: str
    dob: str  # ISO format date string

class ChildResponse(BaseModel):
    id: int
    name: str
    dob: str
    age_months: int

class PregnancyCreate(BaseModel):
    current_week: int

class PregnancyResponse(BaseModel):
    id: int
    current_week: int

class UserProfile(BaseModel):
    id: int
    email: str
    stage: str
    children: List[ChildResponse]
    pregnancy_info: Optional[PregnancyResponse]

class TaskComplete(BaseModel):
    task_id: str
    template_id: Optional[int]

class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    response: str

class AnalysisStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    weekly_adherence: float
    completion_by_date: List[dict]

# ===== Helper Functions =====
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        logger.info(f"Decoded JWT payload: {payload}, user_id: {user_id}")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token - no user_id")
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def calculate_age_months(dob: datetime) -> int:
    today = datetime.now()
    return (today.year - dob.year) * 12 + today.month - dob.month

# ===== Initialize Demo Schedule Templates =====
def initialize_demo_templates(db: Session):
    # Check if templates exist
    existing = db.query(ScheduleTemplate).first()
    if existing:
        return
    
    # Pregnancy templates (weeks 1-40)
    pregnancy_templates = [
        {
            "stage_type": "pregnancy_week",
            "stage_value": 1,
            "tasks_json": [
                {"id": "p1_1", "title": "Take prenatal vitamins", "frequency": "daily"},
                {"id": "p1_2", "title": "Schedule first prenatal appointment", "frequency": "once"},
                {"id": "p1_3", "title": "Stay hydrated (8 glasses water)", "frequency": "daily"}
            ]
        },
        {
            "stage_type": "pregnancy_week",
            "stage_value": 12,
            "tasks_json": [
                {"id": "p12_1", "title": "Take prenatal vitamins", "frequency": "daily"},
                {"id": "p12_2", "title": "Light exercise (20 min walk)", "frequency": "daily"},
                {"id": "p12_3", "title": "Pelvic floor exercises", "frequency": "daily"},
                {"id": "p12_4", "title": "Eat healthy snacks", "frequency": "daily"}
            ]
        },
        {
            "stage_type": "pregnancy_week",
            "stage_value": 24,
            "tasks_json": [
                {"id": "p24_1", "title": "Take prenatal vitamins", "frequency": "daily"},
                {"id": "p24_2", "title": "Monitor baby movements", "frequency": "daily"},
                {"id": "p24_3", "title": "Practice prenatal yoga", "frequency": "3x/week"},
                {"id": "p24_4", "title": "Stay hydrated", "frequency": "daily"},
                {"id": "p24_5", "title": "Rest when tired", "frequency": "daily"}
            ]
        }
    ]
    
    # Child templates (0-36 months)
    child_templates = [
        {
            "stage_type": "child_age_months",
            "stage_value": 0,
            "tasks_json": [
                {"id": "c0_1", "title": "Feed every 2-3 hours", "frequency": "8x/day"},
                {"id": "c0_2", "title": "Tummy time (5 min)", "frequency": "daily"},
                {"id": "c0_3", "title": "Track diaper changes", "frequency": "daily"},
                {"id": "c0_4", "title": "Ensure adequate sleep (16-17 hrs)", "frequency": "daily"}
            ]
        },
        {
            "stage_type": "child_age_months",
            "stage_value": 6,
            "tasks_json": [
                {"id": "c6_1", "title": "Introduce solid foods", "frequency": "2x/day"},
                {"id": "c6_2", "title": "Tummy time (15 min)", "frequency": "daily"},
                {"id": "c6_3", "title": "Read to baby", "frequency": "daily"},
                {"id": "c6_4", "title": "Play with colorful toys", "frequency": "daily"}
            ]
        },
        {
            "stage_type": "child_age_months",
            "stage_value": 12,
            "tasks_json": [
                {"id": "c12_1", "title": "Serve 3 meals + 2 snacks", "frequency": "daily"},
                {"id": "c12_2", "title": "Encourage walking practice", "frequency": "daily"},
                {"id": "c12_3", "title": "Read picture books", "frequency": "daily"},
                {"id": "c12_4", "title": "Play interactive games", "frequency": "daily"},
                {"id": "c12_5", "title": "Naptime (2x per day)", "frequency": "daily"}
            ]
        },
        {
            "stage_type": "child_age_months",
            "stage_value": 24,
            "tasks_json": [
                {"id": "c24_1", "title": "Encourage self-feeding", "frequency": "daily"},
                {"id": "c24_2", "title": "Practice potty training", "frequency": "daily"},
                {"id": "c24_3", "title": "Read stories together", "frequency": "daily"},
                {"id": "c24_4", "title": "Outdoor playtime (30 min)", "frequency": "daily"},
                {"id": "c24_5", "title": "Arts and crafts", "frequency": "3x/week"}
            ]
        }
    ]
    
    all_templates = pregnancy_templates + child_templates
    for template_data in all_templates:
        template = ScheduleTemplate(**template_data)
        db.add(template)
    
    db.commit()

# ===== Authentication Routes =====
@api_router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    new_user = User(email=user_data.email, password_hash=hashed_pw, stage=user_data.stage)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    return {"valid": True, "user_id": current_user.id}

# ===== User Profile Routes =====
@api_router.get("/user/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    children_data = []
    for child in current_user.children:
        age_months = calculate_age_months(child.dob)
        children_data.append({
            "id": child.id,
            "name": child.name,
            "dob": child.dob.isoformat(),
            "age_months": age_months
        })
    
    pregnancy_data = None
    if current_user.pregnancy_info:
        pregnancy_data = {
            "id": current_user.pregnancy_info[0].id,
            "current_week": current_user.pregnancy_info[0].current_week
        }
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "stage": current_user.stage,
        "children": children_data,
        "pregnancy_info": pregnancy_data
    }

@api_router.post("/user/child")
async def add_child(child_data: ChildCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dob = datetime.fromisoformat(child_data.dob.replace('Z', '+00:00'))
    new_child = Child(user_id=current_user.id, name=child_data.name, dob=dob)
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return {"id": new_child.id, "name": new_child.name, "dob": new_child.dob.isoformat()}

@api_router.post("/user/pregnancy")
async def set_pregnancy_info(preg_data: PregnancyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Remove existing
    db.query(PregnancyInfo).filter(PregnancyInfo.user_id == current_user.id).delete()
    
    new_preg = PregnancyInfo(user_id=current_user.id, current_week=preg_data.current_week)
    db.add(new_preg)
    db.commit()
    db.refresh(new_preg)
    return {"id": new_preg.id, "current_week": new_preg.current_week}

# ===== Schedule Routes =====
@api_router.get("/schedules/current")
async def get_current_schedule(child_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.stage == "pregnancy":
        # Get pregnancy info
        preg_info = db.query(PregnancyInfo).filter(PregnancyInfo.user_id == current_user.id).first()
        if not preg_info:
            raise HTTPException(status_code=404, detail="Pregnancy info not found")
        
        # Find closest template
        template = db.query(ScheduleTemplate).filter(
            ScheduleTemplate.stage_type == "pregnancy_week",
            ScheduleTemplate.stage_value <= preg_info.current_week
        ).order_by(ScheduleTemplate.stage_value.desc()).first()
        
        if not template:
            return {"tasks": [], "stage_info": {"type": "pregnancy", "week": preg_info.current_week}}
        
        return {
            "tasks": template.tasks_json,
            "template_id": template.id,
            "stage_info": {"type": "pregnancy", "week": preg_info.current_week}
        }
    
    else:  # child stage
        # Get child
        if child_id:
            child = db.query(Child).filter(Child.id == child_id, Child.user_id == current_user.id).first()
        else:
            child = db.query(Child).filter(Child.user_id == current_user.id).first()
        
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        age_months = calculate_age_months(child.dob)
        
        # Find closest template
        template = db.query(ScheduleTemplate).filter(
            ScheduleTemplate.stage_type == "child_age_months",
            ScheduleTemplate.stage_value <= age_months
        ).order_by(ScheduleTemplate.stage_value.desc()).first()
        
        if not template:
            return {"tasks": [], "stage_info": {"type": "child", "age_months": age_months, "name": child.name}}
        
        return {
            "tasks": template.tasks_json,
            "template_id": template.id,
            "stage_info": {"type": "child", "age_months": age_months, "name": child.name}
        }

# ===== Task Routes =====
@api_router.post("/tasks/complete")
async def complete_task(task_data: TaskComplete, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    completion = TaskCompletion(
        user_id=current_user.id,
        task_id=task_data.task_id,
        template_id=task_data.template_id
    )
    db.add(completion)
    db.commit()
    return {"success": True, "completed_at": completion.completed_at.isoformat()}

@api_router.get("/tasks/completed")
async def get_completed_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    completions = db.query(TaskCompletion).filter(TaskCompletion.user_id == current_user.id).all()
    return [{"task_id": c.task_id, "completed_at": c.completed_at.isoformat()} for c in completions]

# ===== Analysis Routes =====
@api_router.get("/analysis/stats", response_model=AnalysisStats)
async def get_analysis_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get current schedule
    schedule_data = await get_current_schedule(current_user=current_user, db=db)
    total_tasks = len(schedule_data.get("tasks", []))
    
    # Get completions from last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    completions = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == current_user.id,
        TaskCompletion.completed_at >= seven_days_ago
    ).all()
    
    completed_tasks = len(completions)
    completion_percentage = (completed_tasks / (total_tasks * 7) * 100) if total_tasks > 0 else 0
    
    # Weekly adherence (unique tasks completed in last 7 days)
    unique_tasks = len(set(c.task_id for c in completions))
    weekly_adherence = (unique_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Group by date
    completion_by_date = {}
    for c in completions:
        date_key = c.completed_at.date().isoformat()
        completion_by_date[date_key] = completion_by_date.get(date_key, 0) + 1
    
    completion_list = [{"date": k, "count": v} for k, v in completion_by_date.items()]
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": round(completion_percentage, 1),
        "weekly_adherence": round(weekly_adherence, 1),
        "completion_by_date": completion_list
    }

# ===== AI Proxy Routes =====
@api_router.post("/ask", response_model=AIQueryResponse)
async def ask_ai(query_data: AIQueryRequest, db: Session = Depends(get_db)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(AI_URL, json={"query": query_data.query})
            response.raise_for_status()
            ai_response = response.json()
            
            # Log query
            log_entry = AIQuery(
                user_id=None,
                query=query_data.query,
                response=ai_response.get("response", ""),
            )
            db.add(log_entry)
            db.commit()
            
            return {"response": ai_response.get("response", "")}
    except Exception as e:
        logging.error(f"AI request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="AI service unavailable")

# ===== Root Route =====
@api_router.get("/")
async def root():
    return {"message": "NEEV API - Mother and Child Wellness App"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize demo data on startup
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    initialize_demo_templates(db)
    db.close()
    logger.info("NEEV API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("NEEV API shutting down")
