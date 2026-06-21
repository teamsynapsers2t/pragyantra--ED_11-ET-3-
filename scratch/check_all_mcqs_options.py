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

url = f"{SUPABASE_URL}/rest/v1/questions?select=id,question_type,question_text,question_options(id)"
res = requests.get(url, headers=headers)
if res.status_code == 200:
    questions = res.json()
    bad_questions = []
    for q in questions:
        q_type = q.get("question_type", "").lower()
        options = q.get("question_options", [])
        if q_type == "mcq":
            if len(options) < 4:
                bad_questions.append((q.get("id"), len(options), q.get("question_text")[:80]))
                
    print(f"Total MCQ questions with less than 4 options: {len(bad_questions)}")
    for q_id, opt_count, text in bad_questions:
        print(f"  ID: {q_id}, Options Count in DB: {opt_count}, Text: {text}...")
else:
    print("Failed to fetch questions:", res.text)
