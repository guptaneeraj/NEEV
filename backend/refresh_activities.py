import requests

# Configuration
DIRECTUS_URL = "http://localhost:8055"
TOKEN = "KYe03vXlzO8-P1ec00OzGNJpFSHmyYj3" # Replace with your actual token

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def clear_and_seed():
    # --- STEP 1: DELETE ALL EXISTING ACTIVITIES ---
    print("Clearing old activities to prevent duplicates...")
    # We fetch all IDs first
    get_url = f"{DIRECTUS_URL}/items/Activities?limit=-1&fields=id"
    existing = requests.get(get_url, headers=HEADERS).json()
    
    ids_to_delete = [item['id'] for item in existing.get('data', [])]
    
    if ids_to_delete:
        # Delete in bulk
        delete_url = f"{DIRECTUS_URL}/items/Activities"
        requests.delete(delete_url, json=ids_to_delete, headers=HEADERS)
        print(f"Successfully deleted {len(ids_to_delete)} old records.")

    # --- STEP 2: DEFINE NEW 500 ACTIVITIES ---
    # (Abbreviated list for the script, use your CSV for the full 500)
    new_activities = [
        {
            "id": 1,
            "title": "Tummy Time",
            "domain": "Gross Motor",
            "age_group": "Infant",
            "description": "1. Lay a colorful mat on a flat floor. 2. Place the child on their belly. 3. Put a mirror in front of them to encourage neck lifting.",
            "toy_to_use": "Padded Play Mat, Floor Mirror",
            "toy_photo_prompt": "[Image: Colorful Foam Mat]",
            "activity_photo_prompt": "[Image: Baby lifting head on tummy]"
        },
        # ... Add your 500 records here ...
    ]

    # --- STEP 3: BULK UPLOAD ---
    print(f"Uploading {len(new_activities)} fresh activities...")
    post_url = f"{DIRECTUS_URL}/items/Activities"
    response = requests.post(post_url, json=new_activities, headers=HEADERS)
    
    if response.status_code in [200, 204]:
        print("Success! Your 3-year activity library is now live.")
    else:
        print(f"Error during upload: {response.text}")

if __name__ == "__main__":
    clear_and_seed()