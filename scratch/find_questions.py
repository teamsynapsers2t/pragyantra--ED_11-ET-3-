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

def get_questions_for_concept(concept_id):
    url = f"{SUPABASE_URL}/rest/v1/question_concepts?concept_id=eq.{concept_id}&select=question_id"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        return [row['question_id'] for row in res.json()]
    else:
        print(f"Error fetching for concept {concept_id}: {res.text}")
        return []

print("Concept 17 questions:", get_questions_for_concept(17))
print("Concept 26 questions:", get_questions_for_concept(26))
