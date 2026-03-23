import os
import subprocess
from database import engine, SessionLocal
from models import Base
from import_all_plans import import_everything

def reset_db():
    db_path = "neev.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Deleted old database.")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Created new database schema.")

    # Re-import data from Excel
    excel_file = "child_development_AI_dataset_v3_unique.xlsx"
    if os.path.exists(excel_file):
        print("Importing initial data...")
        import_everything(excel_file)
    else:
        print(f"Warning: {excel_file} not found. Database is empty.")

if __name__ == "__main__":
    reset_db()
