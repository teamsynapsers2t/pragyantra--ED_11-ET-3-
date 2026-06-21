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

# Try to insert a dummy attempt with different types to see if it gives type errors or RLS errors.
# Let's try inserting a valid structured payload but with fake Clerk user ID 'test_user'
payload = {
    "user_id": "00000000-0000-0000-0000-000000000000",
    "question_id": 1411, # integer
    "session_id": 123, # integer
    "selected_option": "B",
    "is_correct": False,
    "time_taken_ms": 12000,
    "changed_answer_count": 1,
    "opened_hint": False,
    "opened_solution": False,
    "confidence_rating": 3,
    "attempt_order": 1
}

res = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payload)
print("Insert status:", res.status_code)
print("Response:", res.text)
