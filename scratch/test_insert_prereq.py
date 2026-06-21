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
}

# Try to insert a dummy prerequisite (15, 2, 8)
url = f"{SUPABASE_URL}/rest/v1/concept_prerequisites"
payload = {
    "concept_id": 15,
    "requires_concept_id": 2,
    "relationship_strength": 8
}

res = requests.post(url, headers=headers, json=payload)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
