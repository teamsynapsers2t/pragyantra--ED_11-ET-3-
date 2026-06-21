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

# Fetch all questions from database
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
db_questions = res.json()

# Load local questions
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)

# Index local questions
local_lookup = {}
for lq in local_questions:
    q_text = lq.get("question", "")
    clean_text = "".join(q_text.split()).lower()
    prefix = clean_text[:50]
    if prefix:
        if prefix not in local_lookup:
            local_lookup[prefix] = []
        local_lookup[prefix].append(lq)

chapter_id_to_info = {}

for dbq in db_questions:
    db_text = dbq.get("question_text", "")
    chapter_id = dbq.get("chapter_id")
    clean_db_text = "".join(db_text.split()).lower()
    
    # Simple prefix lookup
    prefix = clean_db_text[:50]
    matched = None
    if prefix in local_lookup:
        matched = local_lookup[prefix][0]
    else:
        for k in local_lookup.keys():
            if k in clean_db_text or clean_db_text[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if matched:
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

# Compile dominant mappings
final_mapping = {}
for cid, info in sorted(chapter_id_to_info.items()):
    # Get the chapter with maximum occurrences
    best_chap = max(info["chapters"].items(), key=lambda x: x[1])[0]
    best_topic = max(info["topics"].items(), key=lambda x: x[1])[0] if info["topics"] else "general"
    
    # Infer subject based on chapter id ranges:
    # 1-29: Physics, 33-49: Chemistry, 61-89: Mathematics
    cid_int = int(cid)
    if cid_int <= 30:
        inferred_subject = "Physics"
    elif cid_int <= 50:
        inferred_subject = "Chemistry"
    else:
        inferred_subject = "Mathematics"
        
    final_mapping[str(cid)] = {
        "chapter_id": cid_int,
        "subject": inferred_subject,
        "chapter": best_chap,
        "topic": best_topic
    }

# Save to mapping.json
with open("scratch/dominant_chapter_mapping.json", "w", encoding="utf-8") as f:
    json.dump(final_mapping, f, indent=2, ensure_ascii=False)

print(f"Extraction complete! Saved {len(final_mapping)} mappings to scratch/dominant_chapter_mapping.json")
# Also print them in full here
for cid, data in sorted(final_mapping.items(), key=lambda x: int(x[0])):
    print(f"ID {cid} -> Subject: {data['subject']}, Chapter: {data['chapter']}, Topic: {data['topic']}")
