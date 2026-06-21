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

# Fetch all mappings
url = f"{SUPABASE_URL}/rest/v1/question_concepts?select=concept_id"
res = requests.get(url, headers=headers)
if res.status_code == 200:
    data = res.json()
    counts = {}
    for row in data:
        cid = row.get("concept_id")
        counts[cid] = counts.get(cid, 0) + 1
    print("Mapped concepts and question counts:")
    for cid, count in sorted(counts.items()):
        print(f"  Concept ID {cid}: {count} questions")
else:
    print(f"Error {res.status_code}: {res.text}")
