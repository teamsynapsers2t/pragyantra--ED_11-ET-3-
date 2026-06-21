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

# Try standard endpoints
endpoints = [
    "information_schema/columns",
    "information_schema.columns",
    "rpc/get_schema",
]

for ep in endpoints:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{ep}", headers=headers)
    print(f"Endpoint '{ep}': status={res.status_code}")
    if res.status_code == 200:
        print(f"  Success: {res.json()[:2]}")
    else:
        print(f"  Error: {res.text[:150]}")
