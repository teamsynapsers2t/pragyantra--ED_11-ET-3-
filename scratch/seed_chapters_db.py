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
    "Content-Type": "application/json",
}

# 1. Fetch all questions from the database
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
if res.status_code != 200:
    print("Error fetching questions:", res.text)
    exit(1)
db_questions = res.json()
print(f"Fetched {len(db_questions)} questions from database.")

# 2. Load local questions
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)
print("Loaded local questions.")

# Index local questions for fast matching
local_lookup = {}
for lq in local_questions:
    clean_text = "".join(lq.get("question", "").split()).lower()
    prefix = clean_text[:50]
    if prefix:
        if prefix not in local_lookup:
            local_lookup[prefix] = []
        local_lookup[prefix].append(lq)

# Match chapter_ids to names/subjects
chapter_id_to_data = {}
for dbq in db_questions:
    cid = dbq.get("chapter_id")
    if cid is None:
        continue
    db_text = dbq.get("question_text", "")
    clean_db_text = "".join(db_text.split()).lower()
    
    # Matching
    prefix = clean_db_text[:50]
    matched = None
    if prefix in local_lookup:
        matched = local_lookup[prefix][0]
    else:
        for k in local_lookup.keys():
            if k in clean_db_text or clean_db_text[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if cid not in chapter_id_to_data:
        chapter_id_to_data[cid] = {"chapters": {}, "subjects": {}}
        
    if matched:
        cname = matched.get("chapter")
        sname = matched.get("subject")
        if cname:
            chapter_id_to_data[cid]["chapters"][cname] = chapter_id_to_data[cid]["chapters"].get(cname, 0) + 1
        if sname:
            chapter_id_to_data[cid]["subjects"][sname] = chapter_id_to_data[cid]["subjects"].get(sname, 0) + 1

# Generate final list of chapters to insert
chapters_to_insert = []
for cid, info in sorted(chapter_id_to_data.items()):
    # Find dominant chapter name
    if info["chapters"]:
        name = max(info["chapters"].items(), key=lambda x: x[1])[0]
    else:
        # Fallback names based on ranges
        if cid <= 30:
            name = f"physics-chapter-{cid}"
        elif cid <= 50:
            name = f"chemistry-chapter-{cid}"
        else:
            name = f"maths-chapter-{cid}"
            
    # Determine subject_id (1 = Physics, 2 = Chemistry, 3 = Mathematics)
    if cid <= 30:
        sub_id = 1
    elif cid <= 50:
        sub_id = 2
    else:
        sub_id = 3
        
    chapters_to_insert.append({
        "id": cid,
        "name": name,
        "subject_id": sub_id
    })

print(f"Preparing to insert {len(chapters_to_insert)} chapters...")

# Clear existing chapters
requests.delete(f"{SUPABASE_URL}/rest/v1/chapters?id=not.is.null", headers=headers)

# Insert chapters
res_insert = requests.post(f"{SUPABASE_URL}/rest/v1/chapters", headers=headers, json=chapters_to_insert)
print("Insert status:", res_insert.status_code)
if res_insert.status_code in [200, 201]:
    print("Successfully seeded chapters in the database!")
else:
    print("Failed to seed chapters:", res_insert.text)
