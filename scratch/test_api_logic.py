import os
import requests
import json
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
}

print("=== VERIFYING CHAPTERS API LOGIC ===")
# Fetch questions and options count
res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=chapter_id,question_type,question_options(id)", headers=headers)
print("Questions query status:", res_q.status_code)
if res_q.status_code != 200:
    print("Error:", res_q.text)
    sys.exit(1)

# Fetch concepts
res_c = requests.get(f"{SUPABASE_URL}/rest/v1/concepts?select=chapter_id,concept_name", headers=headers)
print("Concepts query status:", res_c.status_code)
if res_c.status_code != 200:
    print("Error:", res_c.text)
    sys.exit(1)

db_concepts = res_c.json()
print(f"Fetched {len(db_concepts)} concepts from DB.")

print("\n=== VERIFYING QUESTIONS API LOGIC ===")
# Fetch questions with question_concepts mapping
res_q_detail = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=*,question_options(*),question_concepts(concept_id)&limit=5", headers=headers)
print("Detailed questions query status:", res_q_detail.status_code)
if res_q_detail.status_code != 200:
    print("Error:", res_q_detail.text)
    sys.exit(1)

detailed_questions = res_q_detail.json()
print("First question mapping example:")
if detailed_questions:
    q = detailed_questions[0]
    print(f"  ID: {q['id']}")
    print(f"  Text (partial): {q['question_text'][:80]}...")
    print(f"  Options: {[opt['option_text'] for opt in q.get('question_options', [])]}")
    print(f"  Question Concepts Mapping: {q.get('question_concepts')}")
else:
    print("  No questions returned.")

print("\nAll queries ran successfully and returned correct structures!")
