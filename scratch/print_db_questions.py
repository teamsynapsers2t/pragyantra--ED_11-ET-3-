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

url = f"{SUPABASE_URL}/rest/v1/questions?limit=10"
res = requests.get(url, headers=headers)
if res.status_code == 200:
    for q in res.json():
        print(f"ID: {q['id']}, chapter_id: {q['chapter_id']}, Difficulty: {q['difficulty']}, Year: {q['year']}")
        print(f"Text: {q['question_text'][:150]}")
        print("-" * 50)
else:
    print(res.text)
