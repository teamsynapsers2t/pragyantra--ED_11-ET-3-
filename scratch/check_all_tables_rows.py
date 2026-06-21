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

tables = ["questions", "question_options", "chapters", "sub_concepts", "user_profiles", "user_actions", "ai_roadmaps"]

for table in tables:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=1", headers=headers)
    print(f"Table '{table}': status_code={res.status_code}")
    if res.status_code in [200, 206]:
        print(f"  Content-Range: {res.headers.get('Content-Range')}")
    else:
        # Print error cleanly without unicode issues
        err = res.text.encode('ascii', 'ignore').decode('ascii')
        print(f"  Error: {err}")
