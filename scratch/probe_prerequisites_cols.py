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

# We try a POST of a dummy prerequisite row.
# Wait, let's check what concepts exist in the database so we can use valid ids if needed,
# or we can try inserting concept_id=1, requires_concept_id=2, relationship_strength=10.
payload = {
    "concept_id": 1,
    "requires_concept_id": 2,
    "relationship_strength": 10
}

res = requests.post(f"{SUPABASE_URL}/rest/v1/concept_prerequisites", headers=headers, json=payload)
print("POST status:", res.status_code)
print("Response text:", res.text)

# Let's clean up if inserted successfully
if res.status_code in [200, 201]:
    del_res = requests.delete(f"{SUPABASE_URL}/rest/v1/concept_prerequisites?concept_id=eq.1&requires_concept_id=eq.2", headers=headers)
    print("Delete status:", del_res.status_code)
