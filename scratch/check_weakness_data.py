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

# 1. Get question concepts mapping
res_qc = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts", headers=headers)
qc_map = {}
if res_qc.status_code == 200:
    for row in res_qc.json():
        qc_map[row['question_id']] = row['concept_id']

# 2. Get attempts
res_attempts = requests.get(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers)
if res_attempts.status_code == 200:
    attempts = res_attempts.json()
    print("=== All Attempts ===")
    for a in attempts:
        q_id = a['question_id']
        c_id = qc_map.get(q_id, "Unknown")
        print(f"ID: {a['id']}, Question: {q_id}, Concept: {c_id}, Correct: {a['is_correct']}, Created: {a['created_at']}")
else:
    print(f"Error: {res_attempts.text}")

# 3. Get concept mastery
res_cm = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery", headers=headers)
if res_cm.status_code == 200:
    print("\n=== Concept Mastery ===")
    for row in res_cm.json():
        print(row)

# 4. Get weakness signals
res_ws = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals", headers=headers)
if res_ws.status_code == 200:
    print("\n=== Weakness Signals ===")
    for row in res_ws.json():
        print(row)
