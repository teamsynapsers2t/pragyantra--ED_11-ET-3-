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
}

# Test if table 'attempts' exists
res = requests.get(f"{SUPABASE_URL}/rest/v1/attempts?limit=1", headers=headers)
print("status_code:", res.status_code)
if res.status_code in [200, 206]:
    print("Table 'attempts' EXISTS!")
    print("Content:", res.json())
elif res.status_code == 404:
    print("Table 'attempts' does NOT exist (404).")
else:
    print(f"Error checking: {res.status_code} - {res.text}")

# Test columns
candidates = [
    "id", "user_id", "question_id", "session_id", "selected_option",
    "is_correct", "time_taken_ms", "changed_answer_count", "opened_hint",
    "opened_solution", "created_at", "attempt_order", "confidence_rating"
]
print("\nTesting columns of 'attempts':")
for c in candidates:
    r = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json={c: None})
    if "Could not find the" in r.text:
        print(f"Column '{c}': DOES NOT EXIST")
    else:
        print(f"Column '{c}': EXISTS (status={r.status_code}, response={r.text[:100]})")
