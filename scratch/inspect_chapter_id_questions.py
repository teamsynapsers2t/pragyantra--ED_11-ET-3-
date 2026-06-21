import os
import requests
import re

def clean_text(text):
    if not text:
        return ""
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

res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?chapter_id=eq.6&limit=50", headers=headers)
if res.status_code == 200:
    questions = res.json()
    print(f"Total {len(questions)} questions in Chapter ID 6:")
    for idx, q in enumerate(questions):
        text = clean_text(q.get("question_text", ""))
        source = clean_text(q.get("source", ""))
        print(f"  [{idx+1}] ID {q['id']}, Source: {source}: {text[:120]}...")
else:
    print("Failed:", res.text)
