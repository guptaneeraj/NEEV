import sqlite3
import csv
import os
import json

db_path = os.path.join(os.path.dirname(__file__), 'neev.db')
assets_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'assets', 'Activities')

def sync_plan(plan_name):
    csv_file = os.path.join(assets_dir, f"{plan_name}.csv")
    if not os.path.exists(csv_file):
        print(f"Skipping {plan_name}: File not found at {csv_file}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear existing plans for this type
    cursor.execute('DELETE FROM plan_templates WHERE plan_type = ?', (plan_name.lower(),))

    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                week = row.get('Week')
                domain = row.get('Domain')
                
                activities = []
                # Collect all ActivityN columns
                for i in range(1, 10):
                    act = row.get(f'Activity{i}')
                    if act and act.strip():
                        activities.append(act.strip())
                
                if not week or not activities:
                    continue

                cursor.execute('''
                    INSERT INTO plan_templates 
                    (plan_type, week, domain, activities_json) 
                    VALUES (?, ?, ?, ?)
                ''', (
                    plan_name.lower(),
                    int(week),
                    domain,
                    json.dumps(activities)
                ))
                count += 1
        
        conn.commit()
        print(f"Successfully synced {count} rows for {plan_name}.")
    except Exception as e:
        print(f"Error syncing {plan_name}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    plans = ["20_Min_Plan", "40_Min_Plan", "60_Min_Plan"]
    for p in plans:
        sync_plan(p)
