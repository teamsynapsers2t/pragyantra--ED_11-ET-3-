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

res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=5", headers=headers)
print("status_code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Number of rows:", len(data))
    for idx, row in enumerate(data):
        print(f"\n--- Row {idx+1} ---")
        for k, v in row.items():
            # Print keys and representation of values safely
            print(f"  {k}: {repr(v)}")
else:
    print("Failed:", res.text)
