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

db_res = requests.get(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
db_questions = db_res.json()

with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)

keywords = {
    1: "magnitude same as that of",
    2: "n times the magnitude of",
    3: "particle is moving with a velocity",
    4: "particles are located at equal distance",
    5: "resultant of two vectors"
}

results = []
for dbq in db_questions:
    db_id = dbq.get("id")
    kw = keywords.get(db_id, "")
    
    matched = None
    if kw:
        for lq in local_questions:
            lq_text = lq.get("question", "")
            if kw.lower() in lq_text.lower():
                matched = lq
                break
                
    if matched:
        results.append({
            "db_id": db_id,
            "matched_local_id": matched.get("id"),
            "original_chapter": matched.get("chapter"),
            "original_topic": matched.get("topic"),
            "question_text": dbq.get("question_text")[:120]
        })
    else:
        results.append({
            "db_id": db_id,
            "matched_local_id": None,
            "question_text": dbq.get("question_text")[:120]
        })

with open("scratch/matched_results_loose.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Saved loose matches successfully!")
