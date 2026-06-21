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
}

tables = ["chapters", "sub_concepts", "question_options", "subjects"]

for table in tables:
    # Let's do a post with a dummy column to trigger PostgREST to output all column names in the error!
    res = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers, json={"non_existent_col_abc": 123})
    print(f"\nTable: {table} - status: {res.status_code}")
    print("Response:")
    print(res.text)
