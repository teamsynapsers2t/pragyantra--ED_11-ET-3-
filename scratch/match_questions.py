import json
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

# Fetch the 5 questions from the database
db_res = requests.get(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
if db_res.status_code != 200:
    print("Failed to fetch questions from database:", db_res.text)
    exit(1)
db_questions = db_res.json()

# Load the local jee_questions.json
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)

print(f"Loaded {len(local_questions)} local questions. Matching database questions...")

results = []
for dbq in db_questions:
    db_text = dbq.get("question_text", "")
    db_id = dbq.get("id")
    clean_db_text = "".join(db_text.split()).lower()
    
    matched = None
    for lq in local_questions:
        lq_text = lq.get("question", "")
        clean_lq_text = "".join(lq_text.split()).lower()
        # Clean mathjax and backslashes for better match
        clean_db_text_simple = clean_db_text.replace("\\", "")
        clean_lq_text_simple = clean_lq_text.replace("\\", "")
        if clean_db_text_simple[:40] in clean_lq_text_simple or clean_lq_text_simple[:40] in clean_db_text_simple:
            matched = lq
            break
            
    if matched:
        results.append({
            "db_id": db_id,
            "matched_local_id": matched.get("id"),
            "original_subject": matched.get("subject"),
            "original_chapter": matched.get("chapter"),
            "original_topic": matched.get("topic"),
            "question_text": db_text[:120]
        })
    else:
        results.append({
            "db_id": db_id,
            "matched_local_id": None,
            "question_text": db_text[:120]
        })

with open("scratch/matched_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Saved matches to scratch/matched_results.json successfully!")

