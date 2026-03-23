from sqlalchemy import create_session
from database import engine, SessionLocal
from models import Base, User, Child, MasterActivity, PlanTemplate, AIQuery, MoodLog, HealthRecord
from datetime import datetime, timedelta, timezone
import random

# Recreate tables if needed (optional, depends on if they exist)
# Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    # 1. Users
    users = []
    for i in range(1, 11):
        user = User(
            email=f"user{i}@example.com",
            phone_number=f"987654321{i}",
            password_hash="hashed_password",
            full_name=f"Parent {i}",
            role="user",
            stage=random.choice(["pregnancy", "parenting"]),
            relationship_type=random.choice(["Mother", "Father", "Guardian"])
        )
        db.add(user)
        users.append(user)
    db.commit()

    # 2. Children
    for user in users:
        for j in range(random.randint(1, 2)):
            child = Child(
                user_id=user.id,
                name=f"Child {user.id}-{j}",
                dob=datetime.now() - timedelta(days=random.randint(30, 1000)),
                sex=random.choice(["male", "female"]),
                diet_preference=random.choice(["Vegetarian", "Non-Vegetarian", "Eggetarian"])
            )
            db.add(child)
    db.commit()

    # 3. Master Activities
    domains = ["Physical", "Cognitive", "Social", "Emotional", "Language"]
    for i in range(1, 31):
        activity = MasterActivity(
            activity=f"Activity {i}",
            domain=random.choice(domains),
            description=f"Description for activity {i}. This helps in {random.choice(domains)} development.",
            tools=f"Tool {random.randint(1, 5)}, Tool {random.randint(6, 10)}",
            session_min=10,
            session_max=30
        )
        db.add(activity)
    db.commit()

    # 4. Plan Templates
    for week in range(1, 53):
        for p_type in ["20_min_plan", "40_min_plan", "60_min_plan"]:
            template = PlanTemplate(
                plan_type=p_type,
                week=week,
                domain=random.choice(domains),
                activities_json={"activities": [f"Activity {random.randint(1, 30)}" for _ in range(3)]}
            )
            db.add(template)
    db.commit()

    # 5. Mood Logs & Health Records
    for user in users:
        for _ in range(5):
            mood = MoodLog(
                user_id=user.id,
                mood=random.choice(["Happy", "Calm", "Tired", "Anxious"]),
                notes="Feeling okay today.",
                date=datetime.now() - timedelta(days=random.randint(0, 30))
            )
            db.add(mood)
            
            health = HealthRecord(
                user_id=user.id,
                record_type=random.choice(["Weight", "Height", "Sleep"]),
                value=str(random.randint(5, 15)),
                date=datetime.now() - timedelta(days=random.randint(0, 30)),
                notes="Checkup done."
            )
            db.add(health)
    db.commit()

    print("Seeded 30+ records across all tables.")

if __name__ == "__main__":
    seed()
    db.close()
