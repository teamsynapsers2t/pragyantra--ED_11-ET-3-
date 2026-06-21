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

# Try a dummy POST to concept_mastery to see what column names are accepted/invalid
# and check if RLS is enabled.
payload = {
    "user_id": "654d8d12-7b13-336b-ca41-462af94d0090",
    "concept_id": 7,
    "mastery_score": 100,
    "confidence_score": 5,
    "total_attempts": 1,
    "total_correct": 1,
    "average_time_ms": 12000,
    "weakness_level": 0
}

res = requests.post(f"{SUPABASE_URL}/rest/v1/concept_mastery", headers=headers, json=payload)
print("Insert status:", res.status_code)
print("Response:", res.text)
