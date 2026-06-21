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

columns_to_test = ["id", "subject", "chapter", "topic", "question", "options", "answer", "explanation", "difficulty", "exam", "year", "created_at"]

for col in columns_to_test:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select={col}&limit=1", headers=headers)
    if res.status_code == 200:
        print(f"Column '{col}': EXISTS")
    else:
        print(f"Column '{col}': FAILED ({res.status_code}) - {res.json().get('message')}")
