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

tables = [
    "questions",
    "question_options",
    "question_concepts",
    "question_concept",
    "concepts",
    "sub_concepts",
    "chapters"
]

for table in tables:
    url = f"{SUPABASE_URL}/rest/v1/{table}?limit=5"
    res = requests.get(url, headers=headers)
    print(f"Table '{table}': status={res.status_code}")
    if res.status_code == 200:
        try:
            data = res.json()
            print(f"  Rows count: {len(data)}")
            if len(data) > 0:
                print(f"  Columns: {list(data[0].keys())}")
                print(f"  Sample row: {json.dumps(data[0])[:300]}")
            else:
                print("  Table is empty.")
        except Exception as e:
            print(f"  Error: {e}")
    else:
        print(f"  Response: {res.text[:200]}")
