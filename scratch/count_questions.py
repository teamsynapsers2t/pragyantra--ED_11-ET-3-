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

print("SUPABASE_URL:", SUPABASE_URL)
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=id", headers=headers)
print("status_code:", res.status_code)
if res.status_code == 200:
    ids = res.json()
    print("Total questions in Supabase 'questions' table:", len(ids))
else:
    print("Error:", res.text)
