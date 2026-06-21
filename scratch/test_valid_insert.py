import os
import requests

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

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Fetch a valid question ID
res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=1", headers=headers)
if res_q.status_code != 200:
    print("Failed to fetch questions:", res_q.text)
    exit(1)

questions = res_q.json()
if not questions:
    print("No questions found in database!")
    exit(1)

q_id = questions[0]["id"]
print(f"Found valid question ID: {q_id} (type: {type(q_id)})")

# Try to insert attempt
payload = {
    "user_id": "00000000-0000-0000-0000-000000000000",
    "question_id": q_id,
    "session_id": 123,
    "selected_option": "B",
    "is_correct": False,
    "time_taken_ms": 12000,
    "changed_answer_count": 1,
    "opened_hint": False,
    "opened_solution": False,
    "confidence_rating": 3,
    "attempt_order": 1
}

res_insert = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payload)
print("Insert status:", res_insert.status_code)
print("Response:", res_insert.text)
