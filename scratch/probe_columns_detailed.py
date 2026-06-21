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
    "concepts",
    "sub_concepts",
    "chapters"
]

for table in tables:
    # Triggering a deliberate syntax error in select to get list of columns
    # e.g., select=invalid_col
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=nonexistent_column_for_probing&limit=1"
    res = requests.get(url, headers=headers)
    print(f"Table '{table}' response:")
    if res.status_code == 400:
        err_msg = res.text
        print(f"  Error message: {err_msg}")
    else:
        print(f"  Status: {res.status_code}")
        print(f"  Body: {res.text}")
