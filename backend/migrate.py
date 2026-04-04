import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'neev.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ('first_name', 'VARCHAR'),
    ('last_name', 'VARCHAR'),
    ('sex', 'VARCHAR'),
    ('dob', 'DATETIME'),
    ('marital_status', 'VARCHAR')
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
        print(f"Added column: {col_name}")
    except sqlite3.OperationalError:
        print(f"Column {col_name} already exists or error occurred.")

conn.commit()
conn.close()
print("Migration completed.")
