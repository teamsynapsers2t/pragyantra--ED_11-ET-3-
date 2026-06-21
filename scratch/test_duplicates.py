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

# Try inserting two duplicates for question 672
payloads = [
    {
        "user_id": "00000000-0000-0000-0000-000000000000",
        "question_id": 672,
        "session_id": 999,
        "selected_option": "A",
        "is_correct": False,
        "time_taken_ms": 10000,
        "attempt_order": 1
    },
    {
        "user_id": "00000000-0000-0000-0000-000000000000",
        "question_id": 672,
        "session_id": 999,
        "selected_option": "B",
        "is_correct": False,
        "time_taken_ms": 12000,
        "attempt_order": 1
    }
]

res = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payloads)
print("Insert status:", res.status_code)
print("Response:", res.text)

# Clean up
requests.delete(f"{SUPABASE_URL}/rest/v1/attempts?user_id=eq.00000000-0000-0000-0000-000000000000", headers=headers)
