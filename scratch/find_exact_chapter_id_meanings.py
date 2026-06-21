import os
import requests
import re

def clean_text(text):
    if not text:
        return ""
    # Remove all non-ascii characters to avoid encoding issues
    return re.sub(r'[^\x00-\x7F]+', ' ', text)

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
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=2000", headers=headers)
if res.status_code == 200:
    questions = res.json()
    by_chapter = {}
    for q in questions:
        cid = q.get("chapter_id")
        if cid not in by_chapter:
            by_chapter[cid] = []
        by_chapter[cid].append(q)
        
    for cid in sorted(by_chapter.keys()):
        qs = by_chapter[cid]
        print(f"\n================ Chapter ID {cid} (Total {len(qs)} questions) ================")
        # Print sample question texts
        for i, q in enumerate(qs[:3]):
            text = clean_text(q.get("question_text", ""))
            source = clean_text(q.get("source", ""))
            print(f"  Sample {i+1} [ID {q['id']}, {source}]: {text[:140]}...")
else:
    print("Failed to query questions:", res.text)
