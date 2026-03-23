import os
import random
from datetime import datetime, timedelta, timezone
from database import Base, SessionLocal, engine
from models import User, Child, PregnancyInfo, MasterActivity, PlanTemplate, MoodLog, HealthRecord

# Ensure the DB file is gone so we start fresh
db_path = "neev.db"
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except PermissionError:
        print("Could not delete neev.db. It might be in use by the server.")

def rebuild_and_seed():
    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Users (30 examples)...")
        users = []
        for i in range(1, 31):
            user = User(
                email=f"parent{i}@example.com",
                phone_number=f"+9198765432{i:02d}",
                password_hash="hashed_password_placeholder",
                full_name=f"Parent Name {i}",
                role="user",
                stage=random.choice(["pregnancy", "parenting"]),
                relationship_type=random.choice(["Mother", "Father", "Grandmother", "Grandfather", "Guardian"]),
                onboarding_complete=random.choice([True, False]),
                preferred_plan_type=random.choice(["20_min_plan", "40_min_plan", "60_min_plan"]),
                preferred_time_of_day=random.choice(["morning", "afternoon", "night"]),
                preferred_activity_time="08:00 AM"
            )
            db.add(user)
            db.flush() # To get ID
            users.append(user)
        db.commit()

        print("Seeding Children (40 examples)...")
        for i in range(1, 41):
            parent = random.choice(users)
            child = Child(
                user_id=parent.id,
                name=f"Child {i}",
                dob=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 1000)),
                sex=random.choice(["male", "female", "Prefer not to say"]),
                diet_preference=random.choice(["Vegetarian", "Non-Vegetarian", "Eggetarian"])
            )
            db.add(child)
        db.commit()

        print("Seeding Pregnancy Info...")
        for user in [u for u in users if u.stage == "pregnancy"]:
            preg = PregnancyInfo(
                user_id=user.id,
                pregnant_person_name=user.full_name if user.relationship_type == "Mother" else "Partner",
                is_user_pregnant=(user.relationship_type == "Mother"),
                current_week=random.randint(1, 40),
                diet_preference=user.preferred_plan_type
            )
            db.add(preg)
        db.commit()

        print("Seeding Master Activities (50 examples)...")
        domains = ["Physical", "Cognitive", "Social", "Emotional", "Language"]
        for i in range(1, 51):
            act = MasterActivity(
                activity=f"Developmental Activity {i}",
                domain=random.choice(domains),
                description=f"This is a detailed description for activity {i} which focuses on child development.",
                tools=random.choice(["Soft ball, Mirror", "Storybook, Rattles", "Mashed fruits, Spoon", "Blocks, Music"]),
                session_min=10,
                session_max=40
            )
            db.add(act)
        db.commit()

        print("Seeding Plan Templates...")
        for week in range(1, 53):
            for p_type in ["20_min_plan", "40_min_plan", "60_min_plan"]:
                template = PlanTemplate(
                    plan_type=p_type,
                    week=week,
                    domain=random.choice(domains),
                    activities_json={"activities": [f"Activity {random.randint(1, 50)}" for _ in range(3)]}
                )
                db.add(template)
        db.commit()

        print("Seeding Mood Logs and Health Records...")
        for user in users:
            for _ in range(3):
                db.add(MoodLog(
                    user_id=user.id,
                    mood=random.choice(["Happy", "Calm", "Tired", "Anxious", "Excited"]),
                    notes="Feeling good today.",
                    date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
                ))
                db.add(HealthRecord(
                    user_id=user.id,
                    record_type=random.choice(["Weight", "Height", "Sleep Duration", "Vaccination"]),
                    value=str(random.randint(5, 50)),
                    date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 60)),
                    notes="Routine checkup."
                ))
        db.commit()

        print("Database rebuilt and seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    rebuild_and_seed()
