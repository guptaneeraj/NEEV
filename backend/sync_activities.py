import sqlite3
import csv
import os

db_path = os.path.join(os.path.dirname(__file__), 'neev.db')
csv_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'assets', 'Activities', 'Master_Activities.csv')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Clear existing activities
cursor.execute('DELETE FROM master_activities')

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        # Use DictReader to handle headers
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # New headers: Description (Detailed Steps), Tools (Column E)
            # Some rows might have Session_Min/Max or might not, depending on the full CSV content.
            # I will check for both old and new headers just in case.
            
            activity = row.get('Activity')
            domain = row.get('Domain')
            description = row.get('Description (Detailed Steps)') or row.get('Description')
            tools = row.get('Tools (Column E)') or row.get('Tools')
            
            # Use defaults if mins/maxes aren't in this version of the CSV
            s_min = row.get('Session_Min') or 5
            s_max = row.get('Session_Max') or 15
            
            cursor.execute('''
                INSERT INTO master_activities 
                (activity, domain, description, tools, session_min, session_max) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                activity, 
                domain, 
                description, 
                tools, 
                int(s_min), 
                int(s_max)
            ))
            count += 1
    
    conn.commit()
    print(f"Successfully synced {count} activities.")
except Exception as e:
    print(f"Error syncing activities: {e}")
finally:
    conn.close()
