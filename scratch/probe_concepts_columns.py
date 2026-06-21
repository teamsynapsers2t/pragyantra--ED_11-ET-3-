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

candidate_fields = [
    "id", "name", "chapter_id", "slug", "created_at", "subject_id",
    "subject", "chapter", "concept_name", "concept_id", "description",
    "sequence_order", "is_published"
]

print("Checking concepts columns:")
for col in candidate_fields:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/concepts", headers=headers, json={col: None})
    if "Could not find the" in res.text:
        pass
    else:
        print(f"  Column '{col}' EXISTS! status: {res.status_code}, response: {res.text[:120]}")

print("\nChecking chapters columns:")
for col in candidate_fields:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/chapters", headers=headers, json={col: None})
    if "Could not find the" in res.text:
        pass
    else:
        print(f"  Column '{col}' EXISTS! status: {res.status_code}, response: {res.text[:120]}")
