import os
import json
import requests
from tqdm import tqdm

# Load environment variables from .env.local
def load_env():
    env = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        env[key] = val
    return env

env = load_env()

SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local")
    exit(1)

JSON_FILE_PATH = "jee_questions.json"
BATCH_SIZE = 500

if not os.path.exists(JSON_FILE_PATH):
    print(f"Error: {JSON_FILE_PATH} not found.")
    exit(1)

print("Loading questions from JSON...")
with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
    questions = json.load(f)

# Filter questions to only include Physics
questions = [q for q in questions if q.get("subject", "").strip().lower() == "physics"]

total_questions = len(questions)
print(f"Filtered to {total_questions} Physics questions. Starting upload to Supabase...")

# Supabase REST endpoint
endpoint = f"{SUPABASE_URL}/rest/v1/questions"

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates" # Merge duplicates if id already exists
}

# Delete existing questions first to clean up old data
print("Deleting existing questions from Supabase...")
try:
    delete_response = requests.delete(f"{endpoint}?id=not.is.null", headers={
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    })
    if delete_response.status_code in [200, 204]:
        print("Successfully deleted existing questions.")
    else:
        print(f"Warning: Could not delete existing questions (status code: {delete_response.status_code}). Proceeding anyway.")
        print(delete_response.text)
except Exception as e:
    print(f"Warning: Failed to delete existing questions: {e}. Proceeding anyway.")


# Upload in batches
success_count = 0
for i in range(0, total_questions, BATCH_SIZE):
    batch = questions[i:i + BATCH_SIZE]
    
    # We clean any empty fields or format array types correctly if needed
    try:
        response = requests.post(endpoint, headers=headers, json=batch)
        if response.status_code in [200, 201]:
            success_count += len(batch)
            print(f"Uploaded batch {i//BATCH_SIZE + 1}: {success_count}/{total_questions} questions uploaded.")
        else:
            print(f"Error uploading batch {i//BATCH_SIZE + 1}: {response.status_code}")
            print(response.text)
            break
    except Exception as e:
        print(f"Failed to upload batch {i//BATCH_SIZE + 1}: {e}")
        break

print(f"\nUpload complete! Successfully seeded {success_count} questions.")
