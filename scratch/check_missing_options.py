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

# Fetch all questions and their options count
url = f"{SUPABASE_URL}/rest/v1/questions?select=id,question_type,question_options(id)"
res = requests.get(url, headers=headers)
if res.status_code == 200:
    questions = res.json()
    mcq_total = 0
    mcq_missing = 0
    numerical_total = 0
    
    for q in questions:
        q_id = q.get("id")
        q_type = q.get("question_type")
        options = q.get("question_options", [])
        
        if q_type == "mcq":
            mcq_total += 1
            if len(options) == 0:
                mcq_missing += 1
                if mcq_missing <= 10:
                    print(f"MCQ Question ID {q_id} has 0 options in DB.")
        else:
            numerical_total += 1
            
    print(f"\nSummary:")
    print(f"Total MCQ questions: {mcq_total}")
    print(f"MCQ questions with 0 options: {mcq_missing}")
    print(f"Total Numerical questions: {numerical_total}")
else:
    print("Failed to fetch questions:", res.text)
