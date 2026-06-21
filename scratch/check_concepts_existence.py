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

ids = [2, 8, 9, 15, 16, 19, 34, 35, 72, 89, 90]
url = f"{SUPABASE_URL}/rest/v1/concepts?id=in.({','.join(map(str, ids))})"
res = requests.get(url, headers=headers)
if res.status_code == 200:
    data = res.json()
    print(f"Found {len(data)} concepts out of {len(ids)}:")
    for row in data:
        print(f"  - ID {row['id']}: {row['concept_name']}")
else:
    print(f"Error {res.status_code}: {res.text}")
