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

url = f"{SUPABASE_URL}/rest/v1/weakness_signals?signal=eq.root_flaw"
res = requests.get(url, headers=headers)
print("Status Code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print(f"Found {len(data)} root_flaw signals:")
    for idx, row in enumerate(data):
        print(f"\n--- SIGNAL {idx+1} ---")
        for k, v in row.items():
            print(f"  {k}: {v}")
else:
    print("Error:", res.text)
