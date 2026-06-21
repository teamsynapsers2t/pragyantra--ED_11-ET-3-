import os
import requests
import time

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
url = env.get("NEXT_PUBLIC_SUPABASE_URL")
key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

user_id = "00000000-0000-0000-0000-000000000002"

# Clean up first
requests.delete(f"{url}/rest/v1/attempts?user_id=eq.{user_id}", headers=headers)
requests.delete(f"{url}/rest/v1/concept_mastery?user_id=eq.{user_id}", headers=headers)
requests.delete(f"{url}/rest/v1/weakness_signals?user_id=eq.{user_id}", headers=headers)

# Ensure user exists in users table (since there is a FK constraint on user_id)
# Wait, let's verify if user_id needs to be upserted to users first
requests.post(f"{url}/rest/v1/users", headers=headers, json={"id": user_id})

print("Inserting attempt for question 8 (concept 7)...")
payload = {
    "user_id": user_id,
    "question_id": 8,
    "session_id": "9999",
    "selected_option": "A",
    "is_correct": True,
    "time_taken_ms": 15000,
    "changed_answer_count": 0,
    "opened_hint": False,
    "opened_solution": False,
    "confidence_rating": 5,
    "attempt_order": 1
}

res_insert = requests.post(f"{url}/rest/v1/attempts", headers=headers, json=payload)
print("Insert status:", res_insert.status_code)
if res_insert.status_code != 201:
    print("Insert response:", res_insert.text)

# Wait a second for trigger to complete asynchronously if it's run in background, but normally Postgres trigger runs synchronously in the same transaction
time.sleep(1)

# Fetch concept mastery
res_mastery = requests.get(f"{url}/rest/v1/concept_mastery?user_id=eq.{user_id}", headers=headers)
print("\nConcept Mastery:")
print(res_mastery.json())

# Fetch weakness signals
res_signals = requests.get(f"{url}/rest/v1/weakness_signals?user_id=eq.{user_id}", headers=headers)
print("\nWeakness Signals:")
print(res_signals.json())
