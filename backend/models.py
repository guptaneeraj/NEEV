from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    stage = Column(String, nullable=False)  # 'pregnancy' or 'child'
    relationship_type = Column(String, nullable=True)  # Relationship to child
    preferred_activity_time = Column(String, nullable=True)  # Morning/Afternoon/Evening/Custom
    active_child_id = Column(Integer, nullable=True)  # Currently active child for multi-child users
    created_at = Column(DateTime, default=datetime.utcnow)
    
    children = relationship("Child", back_populates="user", cascade="all, delete-orphan")
    pregnancy_info = relationship("PregnancyInfo", back_populates="user", cascade="all, delete-orphan")
    task_completions = relationship("TaskCompletion", back_populates="user", cascade="all, delete-orphan")

class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    dob = Column(DateTime, nullable=False)
    sex = Column(String, nullable=True)  # Male/Female/Prefer not to say
    diet_preference = Column(String, nullable=True)  # Vegetarian/Eggetarian/Non-vegetarian
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="children")

class PregnancyInfo(Base):
    __tablename__ = "pregnancy_info"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pregnant_person_name = Column(String, nullable=True)
    is_user_pregnant = Column(Boolean, default=True)
    relationship_to_pregnant = Column(String, nullable=True)
    current_week = Column(Integer, nullable=False)
    diet_preference = Column(String, nullable=True)  # Vegetarian/Eggetarian/Non-vegetarian
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="pregnancy_info")

class ScheduleTemplate(Base):
    __tablename__ = "schedule_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    stage_type = Column(String, nullable=False)  # 'pregnancy_week' or 'child_age_months'
    stage_value = Column(Integer, nullable=False)  # week number or age in months
    tasks_json = Column(JSON, nullable=False)  # Array of task objects
    created_at = Column(DateTime, default=datetime.utcnow)

class TaskCompletion(Base):
    __tablename__ = "task_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(String, nullable=False)  # Reference to task in template
    completed_at = Column(DateTime, default=datetime.utcnow)
    template_id = Column(Integer, nullable=True)
    
    user = relationship("User", back_populates="task_completions")

class TaskNote(Base):
    __tablename__ = "task_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    task_id = Column(String, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CustomTask(Base):
    __tablename__ = "custom_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    frequency = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HealthRecord(Base):
    __tablename__ = "health_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    child_id = Column(Integer, nullable=True)
    record_type = Column(String, nullable=False)  # weight, height, appointment, vaccination
    value = Column(String, nullable=True)
    date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EducationalContent(Base):
    __tablename__ = "educational_content"
    
    id = Column(Integer, primary_key=True, index=True)
    stage_type = Column(String, nullable=False)  # pregnancy_week or child_age_months
    stage_value = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)  # tips, nutrition, milestone
    created_at = Column(DateTime, default=datetime.utcnow)

class MoodLog(Base):
    __tablename__ = "mood_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    mood = Column(String, nullable=False)  # happy, sad, anxious, tired, etc.
    notes = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

class SleepLog(Base):
    __tablename__ = "sleep_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    child_id = Column(Integer, nullable=True)
    sleep_start = Column(DateTime, nullable=False)
    sleep_end = Column(DateTime, nullable=False)
    quality = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    milestone_type = Column(String, nullable=False)  # streak, completion_25, completion_50, etc.
    achieved_at = Column(DateTime, default=datetime.utcnow)
    value = Column(Integer, nullable=True)

class AIQuery(Base):
    __tablename__ = "ai_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
