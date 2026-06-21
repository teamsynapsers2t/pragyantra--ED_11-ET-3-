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

res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=2", headers=headers)
print("questions status_code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    import json
    print(json.dumps(data, indent=2))
else:
    print("Failed:", res.text)

res2 = requests.get(f"{SUPABASE_URL}/rest/v1/question_options?limit=5", headers=headers)
print("options status_code:", res2.status_code)
if res2.status_code == 200:
    data = res2.json()
    import json
    print(json.dumps(data, indent=2))
else:
    print("Failed:", res2.text)

