import pandas as pd
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import TaskCompletion # Or whatever your Task model is named

def import_from_excel(file_path: str):
    # 1. Read the Excel file
    df = pd.read_excel(file_path)
    
    # 2. Connect to the database
    db = SessionLocal()
    
    try:
        print(f"Importing {len(df)} tasks...")
        for index, row in df.iterrows():
            # Adjust these field names to match your Excel columns
            new_task = TaskCompletion(
                # title=row['title'],
                # description=row['description'],
                # frequency=row['frequency'],
                # stage=row['stage'],
                # week=row['week']
            )
            db.add(new_task)
        
        db.commit()
        print("Import Successful!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Change 'scheduler.xlsx' to your actual file name
    # import_from_excel("scheduler.xlsx")
    print("Script ready. Please provide the Excel file path and uncomment the line above.")
