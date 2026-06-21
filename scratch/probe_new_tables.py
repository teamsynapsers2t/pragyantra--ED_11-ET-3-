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

tables = ["questions", "question_options", "users", "sessions"]

for table in tables:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=3", headers=headers)
    print(f"\nTable /{table}: status_code={res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Fetched {len(data)} rows.")
        if len(data) > 0:
            print("First row data:")
            for k, v in data[0].items():
                print(f"  {k}: {v} (type: {type(v).__name__})")
        else:
            print("Table is empty.")
    else:
        print(f"Failed to query {table}: {res.text}")
