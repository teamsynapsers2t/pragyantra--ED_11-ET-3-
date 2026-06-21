import os
import json
import requests
import sys

# Ensure stdout uses UTF-8 to prevent Windows terminal encoding errors
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
    "Content-Type": "application/json"
}

# 1. Fetch all questions from the database
print("Fetching all questions from Supabase...")
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=id,question_type,question_text,question_options(id)", headers=headers)
if res.status_code != 200:
    print(f"Error fetching questions: {res.text}")
    sys.exit(1)
db_questions = res.json()
print(f"Fetched {len(db_questions)} questions from Supabase.")

# 2. Load local JSON questions
print("Loading local JSON questions...")
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)
print(f"Loaded {len(local_questions)} questions from local file.")

# Index local questions for fast matching
local_lookup = {}
for lq in local_questions:
    q_text = lq.get("question", "")
    clean = "".join(q_text.split()).lower()
    prefix = clean[:50]
    if prefix:
        if prefix not in local_lookup:
            local_lookup[prefix] = []
        local_lookup[prefix].append(lq)

# 3. Iterate through DB questions, match, and insert options
print("Syncing options...")
options_inserted_count = 0
questions_processed = 0

for dbq in db_questions:
    q_id = dbq.get("id")
    q_type = dbq.get("question_type", "").lower()
    db_options = dbq.get("question_options", [])
    
    if q_type != "mcq":
        continue
        
    # We only process if option count is less than 4 (or if we want to force-refresh)
    if len(db_options) >= 4:
        continue
        
    db_text = dbq.get("question_text", "")
    clean_db_text = "".join(db_text.split()).lower()
    prefix = clean_db_text[:50]
    
    matched = None
    if prefix in local_lookup:
        matched = local_lookup[prefix][0]
    else:
        # Fallback loose search
        for k in local_lookup.keys():
            if k in clean_db_text or clean_db_text[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if matched:
        local_opts = matched.get("options", [])
        if not local_opts or len(local_opts) < 4:
            print(f"Warning: Matched question {q_id} has insufficient options in JSON ({len(local_opts)})")
            continue
            
        # Delete any existing options for this question in the DB to avoid duplicates
        requests.delete(f"{SUPABASE_URL}/rest/v1/question_options?question_id=eq.{q_id}", headers=headers)
        
        # Prepare options payload
        labels = ["A", "B", "C", "D"]
        payload = []
        for idx, opt_text in enumerate(local_opts[:4]):
            payload.append({
                "question_id": q_id,
                "option_label": labels[idx],
                "option_text": opt_text
            })
            
        # Let's check which columns are in the DB and insert
        # We checked: Columns: ['id', 'question_id', 'option_label', 'option_text']
        # Let's insert
        insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/question_options", headers=headers, json=payload)
        if insert_res.status_code in [200, 201]:
            options_inserted_count += len(payload)
            questions_processed += 1
            print(f"Inserted options for question {q_id}")
        else:
            print(f"Failed to insert options for question {q_id}: {insert_res.text}")
    else:
        print(f"Could not find matching JSON question for DB ID {q_id}")

print(f"\nCompleted! Processed {questions_processed} questions and inserted {options_inserted_count} options.")
