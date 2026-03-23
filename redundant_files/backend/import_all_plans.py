import pandas as pd
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import MasterActivity, PlanTemplate, Base

def import_everything(excel_file: str):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Import Master Activities Catalog
        print("Importing Master_Activities sheet...")
        df_master = pd.read_excel(excel_file, sheet_name='Master_Activities')
        for _, row in df_master.iterrows():
            activity = MasterActivity(
                activity=str(row['Activity']).strip(),
                domain=str(row['Domain']).strip() if pd.notna(row['Domain']) else None,
                description=str(row['Description']).strip() if pd.notna(row['Description']) else None,
                tools=str(row['Tools']).strip() if pd.notna(row['Tools']) else "",
                session_min=int(row['Session_Min']) if pd.notna(row['Session_Min']) else 0,
                session_max=int(row['Session_Max']) if pd.notna(row['Session_Max']) else 0
            )
            db.add(activity)
        
        # 2. Import all Plan Sheets
        sheets_config = {
            '20_Min_Plan': 2,
            '40_Min_Plan': 3,
            '60_Min_Plan': 4,
            'Weekly_Planner': 4
        }
        
        for sheet_name, activity_count in sheets_config.items():
            if sheet_name not in pd.ExcelFile(excel_file).sheet_names:
                print(f"Skipping {sheet_name} (not found)")
                continue
                
            print(f"Importing {sheet_name} sheet...")
            df_plan = pd.read_excel(excel_file, sheet_name=sheet_name)
            for _, row in df_plan.iterrows():
                acts = []
                for i in range(1, activity_count + 1):
                    col = f'Activity{i}'
                    if col in row and pd.notna(row[col]):
                        acts.append(str(row[col]).strip())
                
                new_template = PlanTemplate(
                    plan_type=sheet_name.lower(),
                    week=int(row['Week']),
                    domain=str(row['Domain']) if 'Domain' in row and pd.notna(row['Domain']) else None,
                    activities_json=acts
                )
                db.add(new_template)
        
        db.commit()
        print("✅ ALL TABLES UPLOADED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Error during import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    EXCEL_FILE = "child_development_AI_dataset_v3_unique.xlsx"
    import_everything(EXCEL_FILE)
