from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    sex = Column(String, nullable=True)
    dob = Column(DateTime, nullable=True)
    marital_status = Column(String, nullable=True)
    role = Column(String, default="user")
    stage = Column(String, default="pregnancy")
    relationship_type = Column(String, nullable=True)
    onboarding_complete = Column(Boolean, default=False)
    preferred_plan_type = Column(String, nullable=True) # 20_min_plan, 40_min_plan, 60_min_plan
    preferred_time_of_day = Column(String, nullable=True) # morning, afternoon, night
    preferred_activity_time = Column(String, nullable=True) # 08:00 AM
    profile_image = Column(String, nullable=True) # Stores URL/path to image
    active_child_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # New Fields
    otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    children = relationship("Child", back_populates="user", cascade="all, delete-orphan")
    pregnancy_info = relationship("PregnancyInfo", back_populates="user", uselist=False, cascade="all, delete-orphan")
    task_completions = relationship("TaskCompletion", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("AIQuery", back_populates="user", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="user", cascade="all, delete-orphan")
    check_ins = relationship("CheckIn", back_populates="user", cascade="all, delete-orphan")

class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    name = Column(String, nullable=False)
    dob = Column(DateTime, nullable=False)
    time_of_birth = Column(String, nullable=True) # HH:MM AM/PM
    sex = Column(String, nullable=True)
    profile_image = Column(String, nullable=True) # Stores URL/path
    diet_preference = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="children")
    milestones = relationship("Milestone", back_populates="child", cascade="all, delete-orphan")

class PregnancyInfo(Base):
    __tablename__ = "pregnancy_info"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pregnant_person_name = Column(String, nullable=True)
    is_user_pregnant = Column(Boolean, default=True)
    relationship_to_pregnant = Column(String, nullable=True)
    current_week = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=True)
    profile_image = Column(String, nullable=True) # Stores URL/path
    diet_preference = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="pregnancy_info")

class CheckIn(Base):
    __tablename__ = "check_ins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "morning" or "evening"
    date = Column(String, nullable=False)  # YYYY-MM-DD
    sleep_hours = Column(Float, nullable=True)
    night_wakings = Column(Integer, nullable=True)
    baby_mood = Column(String, nullable=True)
    total_feeds = Column(Integer, nullable=True)
    tummy_time = Column(String, nullable=True)
    parent_mood = Column(String, nullable=True)
    new_milestone = Column(String, nullable=True)
    concerns = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="check_ins")

class MasterActivity(Base):
    __tablename__ = "master_activities"
    id = Column(Integer, primary_key=True, index=True)
    activity = Column(String, nullable=False)
    domain = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    tools = Column(Text, nullable=True)
    session_min = Column(Integer, nullable=True)
    session_max = Column(Integer, nullable=True)

class PlanTemplate(Base):
    __tablename__ = "plan_templates"
    id = Column(Integer, primary_key=True, index=True)
    plan_type = Column(String, nullable=False)
    week = Column(Integer, nullable=False)
    domain = Column(String, nullable=True)
    activities_json = Column(JSON, nullable=False)

class TaskCompletion(Base):
    __tablename__ = "task_completions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_name = Column(String, nullable=False)
    week = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="task_completions")

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=True)
    title = Column(String, nullable=False)
    achieved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    age_months = Column(Integer, nullable=True)
    
    user = relationship("User", back_populates="milestones")
    child = relationship("Child", back_populates="milestones")

class AIQuery(Base):
    __tablename__ = "ai_queries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="chat_history")

class MoodLog(Base):
    __tablename__ = "mood_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    mood = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    child_id = Column(Integer, nullable=True)
    record_type = Column(String, nullable=False)
    value = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
