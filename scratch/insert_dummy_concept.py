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
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Try inserting into concepts
# We need to know what columns it has. From previous test, we saw 'id', 'chapter_id', 'concept_name'
payload = {
    "chapter_id": 2,
    "concept_name": "Test Concept Probe"
}

res = requests.post(f"{SUPABASE_URL}/rest/v1/concepts", headers=headers, json=payload)
print("Insert into concepts status:", res.status_code)
print("Response:", res.text)
