import os
import requests
import json

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

# Fetch 5 questions of different types to see columns
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=5", headers=headers)
print("Status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    for q in data:
        print("--- QUESTION ---")
        for k, v in q.items():
            print(f"{k}: {type(v)} = {v}")
else:
    print(res.text)
