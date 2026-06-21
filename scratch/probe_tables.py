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

tables = ["concepts", "concept_mastery", "concept_prerequisites", "weakness_signals"]

for table in tables:
    print(f"\n=== Table: {table} ===")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=1", headers=headers)
    print(f"Status code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        if data:
            print("Row data:")
            print(json.dumps(data[0], indent=2))
        else:
            print("Table is empty (0 rows)")
    else:
        print(f"Error: {res.text}")
