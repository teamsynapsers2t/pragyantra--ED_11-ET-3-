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
    "Content-Type": "application/json",
}

# Fields we want to check for sub_concepts and question_concepts
candidate_fields = [
    "id", "name", "chapter_id", "slug", "sequence_order", "created_at",
    "concept_name", "description", "question_id", "concept_id", "sub_concept_id",
    "subject", "topic", "concept", "sub_concept", "title", "order", "value",
    "key", "code", "text", "question_concept", "question_concept_id"
]

print("Checking sub_concepts columns:")
for col in candidate_fields:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/sub_concepts", headers=headers, json={col: None})
    # If the response doesn't say "Could not find the '...' column", then it exists!
    if "Could not find the" in res.text:
        pass
    else:
        print(f"  Column '{col}' EXISTS! Response status: {res.status_code}, body: {res.text[:100]}")

print("\nChecking question_concepts columns:")
for col in candidate_fields:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/question_concepts", headers=headers, json={col: None})
    if "Could not find the" in res.text:
        pass
    else:
        print(f"  Column '{col}' EXISTS! Response status: {res.status_code}, body: {res.text[:100]}")
