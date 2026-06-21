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
    "Prefer": "count=exact"
}

# Requesting with limit=0 and Prefer: count=exact to get total count
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=1", headers=headers)
print("Status Code:", res.status_code)
print("Headers:", dict(res.headers))
if "Content-Range" in res.headers:
    print("Content-Range Header:", res.headers["Content-Range"])
