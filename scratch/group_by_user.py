import os
import requests
from collections import Counter

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

print("=== User ID Distribution ===")

# Query attempts
res_attempts = requests.get(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers)
if res_attempts.status_code == 200:
    attempts = res_attempts.json()
    user_ids = [a.get("user_id") for a in attempts]
    print(f"Attempts per User: {dict(Counter(user_ids))}")
else:
    print(f"Error reading attempts: {res_attempts.text}")

# Query concept_mastery
res_mastery = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery", headers=headers)
if res_mastery.status_code == 200:
    mastery = res_mastery.json()
    user_ids = [m.get("user_id") for m in mastery]
    print(f"Concept Mastery per User: {dict(Counter(user_ids))}")
else:
    print(f"Error reading concept_mastery: {res_mastery.text}")

# Query weakness_signals
res_signals = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals", headers=headers)
if res_signals.status_code == 200:
    signals = res_signals.json()
    user_ids = [s.get("user_id") for s in signals]
    print(f"Weakness Signals per User: {dict(Counter(user_ids))}")
else:
    print(f"Error reading weakness_signals: {res_signals.text}")
