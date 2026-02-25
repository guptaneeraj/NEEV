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

class AIQuery(Base):
    __tablename__ = "ai_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
