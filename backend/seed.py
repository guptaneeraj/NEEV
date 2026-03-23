"""
NEEV Database Seed Script — Complete Version
=============================================
Run from: C:/agentic-ai/neev-project/backend/
Command:  python seed.py
"""

import sys
import csv
import random
import hashlib
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import (
    Base, User, Child, PlanTemplate, TaskCompletion,
    MoodLog, HealthRecord, Milestone
)

try:
    from models import PregnancyInfo
    HAS_PREGNANCY = True
except ImportError:
    HAS_PREGNANCY = False
    print("PregnancyInfo model not found — skipping pregnancy data")

try:
    from models import MasterActivity
    HAS_MASTER = True
except ImportError:
    HAS_MASTER = False
    print("MasterActivity model not found — skipping master activities")

DB_PATH  = Path(__file__).parent / "neev.db"
CSV_BASE = Path(__file__).parent.parent / "frontend" / "assets" / "Activities"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine  = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)

REAL_ACTIVITIES = [
    "Tummy Time","Rolling Reach","Supported Sitting Play","Crawling Toy Chase",
    "Furniture Cruising","Shape Tracing","Peg Board Insert","Ring Stack Toy",
    "Paper Tear Play","Nursery Rhyme Actions","Face Talking","Where Is The Toy",
    "Word Expansion Game","Pattern Copy","Cause Effect Toy","Stack And Knock Game",
    "Light Switch Game","Sharing Snack Game","Family Photo Talk",
    "Name Calling Response","Dress Up Play","Cold Spoon Touch","Feather Touch",
    "Ice Touch","Sound Shake","Stacking Cups","Button Drop Jar",
    "Guess The Sound","Object Naming","Toy Phone Conversation","Echo Word Game",
    "Counting Objects","Matching Pictures","Shadow Matching","Cup Hide Game",
    "Pretend Doctor Visit","Emotion Story Talk","Group Song Time","Care For Teddy",
    "Finger Sand Drawing","Warm Water Dip","Wind Fan Play","Tiptoe Walk",
    "Sticker Peeling","Marching Game","Animal Walk Game","Grass Walk",
    "Emotion Face Game","Sound Direction Guess","Pretend Feeding Doll",
]

MILESTONE_TEMPLATES = {
    0:  ["First smile","Tracks moving objects","Responds to sound"],
    2:  ["Holds head up during tummy time","Coos and makes sounds","Recognises parent face"],
    4:  ["Rolls from tummy to back","Laughs out loud","Reaches for objects"],
    6:  ["Sits with support","Babbles consonant sounds","Transfers objects hand to hand"],
    8:  ["Sits without support","Says mama dada","Pulls to stand"],
    10: ["Waves bye-bye","Plays peek-a-boo","Crawls on hands and knees"],
    12: ["First steps","Says first word","Points to objects"],
    15: ["Walks independently","Uses 5-10 words","Stacks 2 blocks"],
    18: ["Runs","Uses 20 words","Follows 2-step instructions"],
    24: ["Jumps with both feet","Combines 2 words","Plays alongside other children"],
    30: ["Kicks a ball","Uses 3-word sentences","Names body parts"],
    36: ["Climbs stairs","Speaks in full sentences","Shares with others"],
}

MOODS = ["Happy","Calm","Anxious","Tired","Excited","Overwhelmed","Grateful"]
MOOD_NOTES = [
    "Had a great day with baby","Feeling a bit overwhelmed",
    "Baby slept well last night","Struggled with feeding today",
    "First smile today!","Exhausted but happy",
    "Great tummy time session","Feeling more confident",
    "","","",
]

PLAN_FILES = {
    "20_min_plan": "20_Min_Plan.csv",
    "40_min_plan": "40_Min_Plan.csv",
    "60_min_plan": "60_Min_Plan.csv",
}

FIRST_NAMES = [
    "Priya","Rahul","Anjali","Vikram","Sunita","Amit","Deepa","Rajesh",
    "Meera","Suresh","Kavita","Arjun","Pooja","Nikhil","Rekha","Arun",
    "Shalini","Manoj","Divya","Sanjay","Leela","Prakash","Usha","Vijay",
    "Anita","Ramesh","Geeta","Ashok","Lakshmi","Dinesh","Neha","Ravi",
    "Shanti","Gopal","Padma","Mohan","Kamala","Sunil","Sarla","Rakesh",
]

CHILD_NAMES = [
    "Arjun","Priya","Rohan","Ananya","Kabir","Ishaan","Aanya","Vivaan",
    "Diya","Rehan","Myra","Advait","Kiara","Veer","Saanvi","Ayaan",
    "Anika","Arnav","Pari","Krish","Ira","Shaurya","Navya","Dev",
    "Riya","Siddharth","Aisha","Karan","Tara","Mihir",
]

RELATIONSHIP_TYPES = ["Mother","Father","Grandmother","Grandfather","Guardian"]
PLAN_TYPES         = ["20_min_plan","40_min_plan","60_min_plan"]
TIME_PREFS         = ["morning","afternoon","night"]
ACTIVITY_TIMES     = ["07:00 AM","08:00 AM","09:00 AM","02:00 PM","07:00 PM","08:00 PM"]
DIET_PREFS         = ["Vegetarian","Non-Vegetarian","Eggetarian"]
SEX_OPTIONS        = ["Male","Female"]


def now_utc():
    return datetime.now(timezone.utc)


def load_activities(session):
    print("\n Loading activity CSV files...")
    session.query(PlanTemplate).delete()
    if HAS_MASTER:
        session.query(MasterActivity).delete()
    session.commit()

    total = 0
    for plan_type, filename in PLAN_FILES.items():
        csv_path = CSV_BASE / filename
        if not csv_path.exists():
            print(f"  WARNING: {filename} not found")
            continue
        rows_by_week = {}
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}
                try:
                    week = int(float(row.get("Week", 0)))
                except:
                    continue
                domain = row.get("Domain", "")
                acts = [{"title": v, "domain": domain, "completed": False}
                        for k, v in row.items() if k.lower().startswith("activity") and v]
                if week not in rows_by_week:
                    rows_by_week[week] = {"domain": domain, "activities": []}
                rows_by_week[week]["activities"].extend(acts)

        for week, data in rows_by_week.items():
            seen, unique = set(), []
            for a in data["activities"]:
                if a["title"] not in seen:
                    seen.add(a["title"])
                    unique.append(a)
            session.add(PlanTemplate(
                plan_type=plan_type, week=week,
                domain=data["domain"], activities_json=unique
            ))
            total += 1

        print(f"  OK {plan_type}: {len(rows_by_week)} weeks")

    session.commit()

    if HAS_MASTER:
        master_path = CSV_BASE / "Master_Activities.csv"
        if master_path.exists():
            count = 0
            with open(master_path, newline="", encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    row = {k.strip(): (v.strip() if v else "") for k, v in row.items()}
                    session.add(MasterActivity(
                        activity    = row.get("Activity",""),
                        domain      = row.get("Domain",""),
                        description = row.get("Description",""),
                        tools       = row.get("Tools",""),
                        session_min = int(row["Session_Min"]) if row.get("Session_Min") else None,
                        session_max = int(row["Session_Max"]) if row.get("Session_Max") else None,
                    ))
                    count += 1
            session.commit()
            print(f"  OK Master activities: {count}")

    print(f"  Total plan templates: {total}")


def generate_users(session):
    print("\n Generating 300 beta users...")

    existing = session.query(User).count()
    if existing > 0:
        ans = input(f"  {existing} users exist. Delete and regenerate? (y/n): ").strip().lower()
        if ans != "y":
            print("  Skipping.")
            return
        for m in [TaskCompletion, MoodLog, HealthRecord, Milestone]:
            session.query(m).delete()
        if HAS_PREGNANCY:
            session.query(PregnancyInfo).delete()
        session.query(Child).delete()
        session.query(User).delete()
        session.commit()
        print("  Cleared existing data.")

    now   = now_utc()
    start = now - timedelta(days=120)

    templates_by_plan = {}
    for pt in PLAN_TYPES:
        templates_by_plan[pt] = session.query(PlanTemplate).filter_by(plan_type=pt).all()

    for i in range(300):
        name         = random.choice(FIRST_NAMES)
        is_pregnancy = random.random() < 0.25
        plan_type    = random.choice(PLAN_TYPES)
        reg_date     = start + timedelta(days=random.randint(0, 110))

        user = User(
            email                   = f"{name.lower()}_{i+1}@neevbeta.com",
            hashed_password         = hashlib.sha256(f"beta{i}".encode()).hexdigest(),
            full_name               = name,
            relationship_type       = random.choice(RELATIONSHIP_TYPES),
            stage                   = "pregnancy" if is_pregnancy else "parenting",
            preferred_plan_type     = plan_type,
            preferred_time_of_day   = random.choice(TIME_PREFS),
            preferred_activity_time = random.choice(ACTIVITY_TIMES),
            onboarding_complete     = True,
            is_verified             = True,
        )
        if hasattr(User, "created_at"):
            user.created_at = reg_date
        session.add(user)
        session.flush()

        days_active = (now - reg_date).days
        child = None

        if not is_pregnancy:
            age_months = random.randint(0, 35)
            dob = now - timedelta(days=age_months * 30 + random.randint(0, 15))
            child = Child(
                user_id=user.id, name=random.choice(CHILD_NAMES),
                dob=dob, sex=random.choice(SEX_OPTIONS),
                diet_preference=random.choice(DIET_PREFS),
            )
            session.add(child)
            session.flush()

        if is_pregnancy and HAS_PREGNANCY:
            week = random.randint(6, 38)
            session.add(PregnancyInfo(
                user_id=user.id, current_week=week,
                is_user_pregnant=True, relationship_to_pregnant="Self",
                due_date=now + timedelta(weeks=(40 - week)),
            ))

        templates = templates_by_plan.get(plan_type, [])
        if templates:
            for day_off in range(days_active):
                if random.random() > 0.35:
                    d = reg_date + timedelta(days=day_off)
                    t = random.choice(templates)
                    acts = t.activities_json or []
                    n = random.randint(1, min(3, len(acts))) if acts else 0
                    for act in (random.sample(acts, n) if len(acts) >= n else acts):
                        session.add(TaskCompletion(
                            user_id=user.id,
                            activity_name=act.get("title","Activity"),
                            week=t.week,
                            completed_at=d + timedelta(hours=random.randint(7,20), minutes=random.randint(0,59)),
                        ))

        for wk in range(days_active // 7):
            for _ in range(random.randint(2, 4)):
                ld = reg_date + timedelta(days=wk*7+random.randint(0,6), hours=random.randint(8,22))
                if ld > now: break
                session.add(MoodLog(user_id=user.id, mood=random.choice(MOODS),
                                    notes=random.choice(MOOD_NOTES), date=ld))

        if child:
            for mo in range(days_active // 30):
                rd = reg_date + timedelta(days=mo*30+random.randint(0,20))
                if rd > now: break
                age_at = max(0, (rd - child.dob).days // 30)
                bw = 3.5 + age_at * 0.45
                bh = 50  + age_at * 1.5
                bc = 33  + age_at * 0.5  # head circumference

                # Generate 2-4 varied health records per month
                num_records = random.randint(2, 4)
                record_choices = [
                    ("Weight", str(round(random.uniform(bw*0.93, bw*1.07), 1)), "kg", None),
                    ("Height", str(round(random.uniform(bh*0.97, bh*1.03), 1)), "cm", None),
                    ("Head Circumference", str(round(random.uniform(bc*0.97, bc*1.03), 1)), "cm", None),
                    ("Feeds Per Day", str(random.choice([6,7,8,9,10] if age_at < 6 else [3,4,5,6])), "times", None),
                    ("Feed Duration", str(random.choice([10,15,20,25,30])), "min", None),
                    ("Feed Type", random.choice(["Breastfeed","Formula","Mixed","Breastfeed + Solids"] if age_at >= 5 else ["Breastfeed","Formula","Mixed"]), "", None),
                    ("Night Sleep", str(round(random.uniform(5, 10), 1)), "hrs", None),
                    ("Total Sleep", str(round(random.uniform(11, 17), 1)), "hrs", None),
                    ("Night Wakings", str(random.choice([0,1,2,3,4])), "times", None),
                    ("Naps Per Day", str(random.choice([1,2,3] if age_at < 12 else [1,2])), "times", None),
                    ("Tummy Time", str(random.choice([5,10,15,20,30])), "min", None),
                    ("Screen Time", str(random.choice([0,0,0,15,30])), "min", None),
                    ("Outdoor Time", str(random.choice([15,30,45,60])), "min", None),
                    ("Fever", str(round(random.uniform(37.0, 38.5), 1)), "°C", None),
                ]

                # Add vaccination records based on age
                vacc_schedule = {
                    0: [("BCG","Dose 1"),("OPV-0","Dose 1"),("Hepatitis B (Birth)","Dose 1")],
                    6: [("DTP-1","Dose 1"),("Hib-1","Dose 1"),("IPV-1","Dose 1"),("PCV-1","Dose 1"),("Rotavirus-1","Dose 1")],
                    10: [("DTP-2","Dose 2"),("Hib-2","Dose 2"),("IPV-2","Dose 2"),("PCV-2","Dose 2"),("Rotavirus-2","Dose 2")],
                    14: [("DTP-3","Dose 3"),("Hib-3","Dose 3"),("IPV-3","Dose 3"),("PCV-3","Dose 3"),("Rotavirus-3","Dose 3")],
                    24: [("MMR-1","Dose 1"),("Varicella-1","Dose 1")],
                    36: [("MMR-2","Dose 2"),("DTP Booster","Booster")],
                }
                for vacc_age, vaccinations in vacc_schedule.items():
                    if age_at == vacc_age and random.random() < 0.85:
                        vacc = random.choice(vaccinations)
                        record_choices.append(("Vaccination", vacc[0], "", vacc[1]))

                chosen = random.sample(record_choices, min(num_records, len(record_choices)))
                for rt, val, unit, sub_val in chosen:
                    hr_kwargs = dict(
                        user_id=user.id,
                        record_type=rt,
                        value=val,
                        date=rd + timedelta(hours=random.randint(8,18)),
                        notes=""
                    )
                    if hasattr(HealthRecord, "unit"):
                        hr_kwargs["unit"] = unit
                    if hasattr(HealthRecord, "sub_value"):
                        hr_kwargs["sub_value"] = sub_val
                    session.add(HealthRecord(**hr_kwargs))

            age_months = max(0, (now - child.dob).days // 30)
            for m_age, titles in MILESTONE_TEMPLATES.items():
                if m_age <= age_months:
                    for title in titles:
                        if random.random() < 0.8:
                            achieved = child.dob + timedelta(days=m_age*30+random.randint(0,20))
                            session.add(Milestone(
                                user_id=user.id, child_id=child.id,
                                title=title, achieved_at=achieved,
                                age_months=m_age, notes="",
                            ))

        if (i+1) % 50 == 0:
            session.commit()
            print(f"  {i+1}/300 users created...")

    session.commit()
    print("  Done.")


def main():
    print("=" * 55)
    print("  NEEV Database Seed Script")
    print("=" * 55)
    print(f"  DB : {DB_PATH}")
    print(f"  CSV: {CSV_BASE}")

    Base.metadata.create_all(bind=engine)

    s = Session()
    try:
        load_activities(s)
        generate_users(s)

        print("\n" + "=" * 55)
        print("  FINAL COUNTS")
        print("=" * 55)
        for model, label in [
            (PlanTemplate,"Plan templates"),
            (User,"Users"),
            (Child,"Children"),
            (TaskCompletion,"Task completions"),
            (MoodLog,"Mood logs"),
            (HealthRecord,"Health records"),
            (Milestone,"Milestones"),
        ]:
            print(f"  {label:<20}: {s.query(model).count()}")
        if HAS_MASTER:
            print(f"  {'Master activities':<20}: {s.query(MasterActivity).count()}")
        if HAS_PREGNANCY:
            print(f"  {'Pregnancy info':<20}: {s.query(PregnancyInfo).count()}")
        print("=" * 55)
        print("\n  Seed complete.")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback; traceback.print_exc()
        s.rollback()
    finally:
        s.close()


if __name__ == "__main__":
    main()