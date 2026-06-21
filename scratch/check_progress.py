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

# Fetch all questions
all_questions = []
for offset in [0, 1000]:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=id,chapter_id&limit=1000&offset={offset}", headers=headers)
    if res.status_code == 200:
        all_questions.extend(res.json())

# Count distribution
distribution = {}
for q in all_questions:
    cid = q.get("chapter_id")
    distribution[cid] = distribution.get(cid, 0) + 1

print("Current distribution of chapter IDs:")
for cid, count in sorted(distribution.items()):
    print(f"  Chapter ID {cid}: {count} questions")
