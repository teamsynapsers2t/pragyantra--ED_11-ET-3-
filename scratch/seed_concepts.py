import os
import json
import requests
import sys

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
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Load local JSON questions
print("Loading local JSON questions...")
with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)

# Filter Units & Dimensions (chapter_id = 2)
# Let's index local questions by matching DB question text
# We first fetch DB questions for chapter_id = 2
print("Fetching chapter 2 questions from Supabase...")
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?chapter_id=eq.2", headers=headers)
if res.status_code != 200:
    print("Failed to fetch questions:", res.text)
    sys.exit(1)
db_questions = res.json()
print(f"Fetched {len(db_questions)} questions from DB.")

# Map DB question text to JSON question for matching topic
local_lookup = {}
for lq in local_questions:
    sub = lq.get("subject", "").lower()
    chap = lq.get("chapter", "").lower()
    if "physics" in sub and "units" in chap:
        q_text = lq.get("question", "")
        clean = "".join(q_text.split()).lower()
        prefix = clean[:50]
        if prefix:
            if prefix not in local_lookup:
                local_lookup[prefix] = []
            local_lookup[prefix].append(lq)

# 2. Extract unique topics from DB questions matching JSON
unique_topics = set()
db_question_to_topic = {}

for dbq in db_questions:
    q_id = dbq.get("id")
    q_text = dbq.get("question_text", "")
    clean_db = "".join(q_text.split()).lower()
    prefix = clean_db[:50]
    
    matched = None
    if prefix in local_lookup:
        matched = local_lookup[prefix][0]
    else:
        for k in local_lookup.keys():
            if k in clean_db or clean_db[:30] in k:
                matched = local_lookup[k][0]
                break
                
    if matched:
        topic = matched.get("topic")
        if topic:
            unique_topics.add(topic)
            db_question_to_topic[q_id] = topic
        else:
            db_question_to_topic[q_id] = "general"
    else:
        db_question_to_topic[q_id] = "general"

if not unique_topics:
    # Fallback to general topics
    unique_topics = {"dimensions-of-physical-quantities", "errors-in-measurement", "vernier-calipers", "screw-gauge", "unit-of-physical-quantities"}

print(f"Found unique topics: {unique_topics}")

# Delete existing concepts for chapter 2 to avoid duplicate keys or RLS conflicts
# (since we don't have DELETE RLS issues if read is enabled or delete is allowed, let's try)
try:
    requests.delete(f"{SUPABASE_URL}/rest/v1/concepts?chapter_id=eq.2", headers=headers)
except Exception as e:
    print("Delete error:", e)

# 3. Seed concepts table
concept_name_to_id = {}
for topic in unique_topics:
    payload = {
        "chapter_id": 2,
        "concept_name": topic
    }
    res_concept = requests.post(f"{SUPABASE_URL}/rest/v1/concepts", headers=headers, json=payload)
    if res_concept.status_code in [200, 201]:
        created = res_concept.json()
        if created:
            c_id = created[0].get("id")
            concept_name_to_id[topic] = c_id
            print(f"Seeded concept: '{topic}' with ID {c_id}")
    else:
        print(f"Failed to seed concept '{topic}': {res_concept.text}")

# 4. Seed question_concepts table
# Delete existing question_concepts first
q_ids_str = ",".join(str(q_id) for q_id in db_question_to_topic.keys())
try:
    requests.delete(f"{SUPABASE_URL}/rest/v1/question_concepts?question_id=in.({q_ids_str})", headers=headers)
except Exception as e:
    print("Delete question_concepts error:", e)

question_concepts_payload = []
for q_id, topic in db_question_to_topic.items():
    if topic in concept_name_to_id:
        c_id = concept_name_to_id[topic]
        question_concepts_payload.append({
            "question_id": q_id,
            "concept_id": c_id
        })

if question_concepts_payload:
    res_qc = requests.post(f"{SUPABASE_URL}/rest/v1/question_concepts", headers=headers, json=question_concepts_payload)
    if res_qc.status_code in [200, 201]:
        print(f"Successfully seeded {len(question_concepts_payload)} question-concept mappings!")
    else:
        print(f"Failed to seed question-concept mappings: {res_qc.text}")
else:
    print("No question-concept mappings to seed.")
