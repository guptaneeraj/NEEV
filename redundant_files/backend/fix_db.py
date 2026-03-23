import sqlite3
import os

def fix():
    db_path = os.path.join(os.path.dirname(__file__), "neev.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    updates = [
        ("users", "full_name", "TEXT"),
        ("users", "preferred_time_of_day", "TEXT"),
        ("task_completions", "activity_name", "TEXT"),
        ("task_completions", "week", "INTEGER")
    ]
    
    for table, col, dtype in updates:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}")
            print(f"Added {col} to {table}")
        except sqlite3.OperationalError: pass
            
    conn.commit()
    conn.close()
    print("✅ Schema sync complete.")

if __name__ == "__main__": fix()
