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

# Fetch all 1215 questions (fetch in pages of 1000)
all_questions = []
for offset in [0, 1000]:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=1000&offset={offset}", headers=headers)
    if res.status_code == 200:
        all_questions.extend(res.json())

print("Total questions fetched:", len(all_questions))

sources = {}
chapter_ids = {}
for q in all_questions:
    src = q.get("source", "Unknown")
    sources[src] = sources.get(src, 0) + 1
    cid = q.get("chapter_id")
    chapter_ids[cid] = chapter_ids.get(cid, 0) + 1

print("\nSources in database:")
for src, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
    print(f"  {src}: {count} questions")

print("\nChapter IDs in database:")
for cid, count in sorted(chapter_ids.items()):
    print(f"  Chapter ID {cid}: {count} questions")
