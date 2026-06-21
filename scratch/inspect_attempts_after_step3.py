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
}

user_id = "654d8d12-7b13-336b-ca41-462af94d0090" # Auditor user ID

# 1. Fetch all attempts for this user
res = requests.get(f"{SUPABASE_URL}/rest/v1/attempts?user_id=eq.{user_id}", headers=headers)
print("Attempts Status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print(f"Attempts count: {len(data)}")
    for idx, r in enumerate(data):
        print(f"  Attempt {idx+1}: id={r.get('id')}, question_id={r.get('question_id')}, is_correct={r.get('is_correct')}, attempt_order={r.get('attempt_order')}")
else:
    print(res.text)

# 2. Fetch concept mastery for this user
res_cm = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{user_id}", headers=headers)
print("\nConcept Mastery Status:", res_cm.status_code)
if res_cm.status_code == 200:
    print(res_cm.json())
