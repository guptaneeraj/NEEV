import pandas as pd
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import MasterActivity, Base

def import_master_activities(excel_file: str):
    # 1. Ensure the table exists in the DB
    Base.metadata.create_all(bind=engine)
    
    try:
        # 2. Read the specific sheet 'Master_Activities'
        print(f"Reading {excel_file}...")
        df = pd.read_excel(excel_file, sheet_name='Master_Activities')
        
        # 3. Connect to DB
        db = SessionLocal()
        
        print(f"Found {len(df)} activities. Starting import...")
        
        for index, row in df.iterrows():
            # Mapping Excel headers to Database columns
            new_activity = MasterActivity(
                activity=str(row['Activity']).strip(),
                domain=str(row['Domain']).strip() if pd.notna(row['Domain']) else None,
                description=str(row['Description']).strip() if pd.notna(row['Description']) else None,
                tools=str(row['Tools']).strip() if pd.notna(row['Tools']) else None,
                session_1=str(row['Session_1']).strip() if pd.notna(row['Session_1']) else None,
                session_2=str(row['Session_2']).strip() if pd.notna(row['Session_2']) else None,
                sessions_per_day_max=int(row['Sessions_Per_Day_Max']) if pd.notna(row['Sessions_Per_Day_Max']) else None
            )
            db.add(new_activity)
        
        db.commit()
        print(f"✅ Successfully imported {len(df)} activities into MasterActivity table!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    # CHANGE THIS to your actual Excel filename
    FILENAME = "child_development_AI_dataset_v3_unique.xlsx" 
    import_master_activities(FILENAME)
