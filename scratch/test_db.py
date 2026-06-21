import os
import json
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

print("Supabase URL:", SUPABASE_URL)

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}

try:
    response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
    print("Status code:", response.status_code)
    if response.status_code == 200:
        schema = response.json()
        definitions = schema.get("definitions", {})
        print("Tables in schema:", list(definitions.keys()))
        for table_name, table_def in definitions.items():
            print(f"\nTable: {table_name}")
            properties = table_def.get("properties", {})
            print("Columns:")
            for col_name, col_def in properties.items():
                print(f"  {col_name}: {col_def.get('type')} (format: {col_def.get('format')})")
    else:
        print("Error response:", response.text)
except Exception as e:
    print("Error querying schema:", e)
import sys; sys.exit(0)


