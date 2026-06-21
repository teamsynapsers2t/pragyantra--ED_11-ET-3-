import os
import requests
import json

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

# Fetch all questions from database (1000 questions)
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
if res.status_code != 200:
    print("Failed to fetch questions:", res.text)
    sys.exit(1)
db_questions = res.json()
print(f"Fetched {len(db_questions)} questions from DB.")

# Load jee_questions.json
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)
print(f"Loaded {len(local_questions)} local questions.")

# Index local questions by a clean prefix of the question text for fast lookup
local_lookup = {}
for lq in local_questions:
    q_text = lq.get("question", "")
    # Clean text to make matching robust
    clean_text = "".join(q_text.split()).lower()
    # Try using the first 50 characters as key
    prefix = clean_text[:50]
    if prefix:
        if prefix not in local_lookup:
            local_lookup[prefix] = []
        local_lookup[prefix].append(lq)

# Match and map
chapter_id_to_info = {}
matched_count = 0

for dbq in db_questions:
    db_text = dbq.get("question_text", "")
    chapter_id = dbq.get("chapter_id")
    clean_db_text = "".join(db_text.split()).lower()
    
    # Try looking up by prefix
    prefix = clean_db_text[:50]
    matched = None
    if prefix in local_lookup:
        # If there are candidates, find the one with closest match or just the first
        matched = local_lookup[prefix][0]
    else:
        # Fallback: scan candidate prefixes
        for k in local_lookup.keys():
            if k in clean_db_text or clean_db_text[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if matched:
        matched_count += 1
        subj = matched.get("subject")
        chap = matched.get("chapter")
        topic = matched.get("topic")
        
        if chapter_id not in chapter_id_to_info:
            chapter_id_to_info[chapter_id] = {
                "subject": subj,
                "chapters": {},
                "topics": {}
            }
        
        chapter_id_to_info[chapter_id]["chapters"][chap] = chapter_id_to_info[chapter_id]["chapters"].get(chap, 0) + 1
        chapter_id_to_info[chapter_id]["topics"][topic] = chapter_id_to_info[chapter_id]["topics"].get(topic, 0) + 1

print(f"\nSuccessfully matched {matched_count} / {len(db_questions)} questions.")
print("\nMapping of chapter_id to original chapter/topic names:")
for cid, info in sorted(chapter_id_to_info.items()):
    print(f"Chapter ID {cid}:")
    print(f"  Subject: {info['subject']}")
    print(f"  Chapter names: {dict(sorted(info['chapters'].items(), key=lambda x: x[1], reverse=True))}")
    print(f"  Topic names (first 3): {list(sorted(info['topics'].items(), key=lambda x: x[1], reverse=True))[:3]}")
