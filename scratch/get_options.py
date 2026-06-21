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

for table in ["chapters", "sub_concepts", "questions"]:
    res = requests.options(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers)
    print(f"\nTable: {table}")
    if res.status_code == 200:
        try:
            schema = res.json()
            print("Columns and types:")
            properties = schema.get("definitions", {}).get(table, {}).get("properties", {})
            for col, prop in properties.items():
                print(f"  {col}: {prop.get('type')} (format: {prop.get('format')})")
        except Exception as e:
            print("Error parsing json schema:", e)
    else:
        print("Failed:", res.text)
