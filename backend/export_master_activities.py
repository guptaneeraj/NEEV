"""
Run once from backend folder to export master_activities CSV → JSON
so agent.py can load it at startup for task grounding.

Usage:
  cd C:/agentic-ai/neev-project/backend
  python export_master_activities.py
"""
import csv, json
from pathlib import Path

CSV_PATH  = Path("../frontend/assets/Activities/Master_Activities.csv")
JSON_PATH = Path("data/master_activities.json")

def main():
    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}")
        return

    activities = []
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            activities.append({k.strip(): v.strip() for k, v in row.items()})

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_PATH, "w") as f:
        json.dump(activities, f, indent=2)

    print(f"Exported {len(activities)} activities to {JSON_PATH}")

if __name__ == "__main__":
    main()