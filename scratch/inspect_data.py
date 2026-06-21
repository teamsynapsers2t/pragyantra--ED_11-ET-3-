import os
import sys
import json
import requests

# Reconfigure stdout to use utf-8
sys.stdout.reconfigure(encoding='utf-8')

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

res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=5", headers=headers)
if res.status_code == 200:
    questions = res.json()
    print("Sample questions from Supabase:")
    for idx, q in enumerate(questions):
        print(f"[{idx}] ID: {q.get('id')}, Chapter ID: {q.get('chapter_id')}, Exam Type: {q.get('exam_type')}, Subject: {q.get('subject')}")
else:
    print("Failed to query questions:", res.text)
