import sqlite3
import os
from pathlib import Path

def initialize_database():
    db_path = Path(__file__).parent / "neev.db"
    print(f"Connecting to database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Define all tables and columns to ensure they exist
    # format: (table_name, column_definition)
    schema = {
        "users": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "email TEXT UNIQUE",
            "phone_number TEXT UNIQUE",
            "password_hash TEXT NOT NULL",
            "full_name TEXT",
            "role TEXT DEFAULT 'user'",
            "stage TEXT DEFAULT 'pregnancy'",
            "relationship_type TEXT",
            "preferred_activity_time TEXT",
            "preferred_time_of_day TEXT",
            "profile_image TEXT",
            "active_child_id INTEGER",
            "created_at DATETIME"
        ],
        "children": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "user_id INTEGER",
            "name TEXT NOT NULL",
            "dob DATETIME NOT NULL",
            "sex TEXT",
            "profile_image TEXT",
            "diet_preference TEXT",
            "created_at DATETIME"
        ],
        "pregnancy_info": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "user_id INTEGER",
            "current_week INTEGER NOT NULL",
            "due_date TEXT",
            "profile_image TEXT",
            "diet_preference TEXT",
            "created_at DATETIME"
        ],
        "plan_templates": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "plan_type TEXT NOT NULL",
            "week INTEGER NOT NULL",
            "domain TEXT",
            "activities_json JSON NOT NULL"
        ],
        "task_completions": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "user_id INTEGER",
            "activity_name TEXT NOT NULL",
            "week INTEGER NOT NULL",
            "completed_at DATETIME"
        ],
        "ai_queries": [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "user_id INTEGER",
            "query TEXT NOT NULL",
            "response TEXT NOT NULL",
            "created_at DATETIME"
        ]
    }

    for table, cols in schema.items():
        # Create table if not exists
        cursor.execute(f"CREATE TABLE IF NOT EXISTS {table} (id INTEGER PRIMARY KEY AUTOINCREMENT)")
        
        # Check and add each column
        cursor.execute(f"PRAGMA table_info({table})")
        existing_cols = [row[1] for row in cursor.fetchall()]
        
        for col_def in cols:
            col_name = col_def.split(" ")[0]
            if col_name not in existing_cols:
                try:
                    print(f"Adding column {col_name} to {table}...")
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
                except Exception as e:
                    print(f"Error adding {col_name} to {table}: {e}")

    conn.commit()
    conn.close()
    print("✅ Database successfully initialized and synced.")

if __name__ == "__main__":
    initialize_database()
