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
    "Prefer": "return=representation"
}

user_id = "654d8d12-7b13-336b-ca41-462af94d0090"

# Clean up first
print("[*] Cleaning up...")
requests.delete(f"{SUPABASE_URL}/rest/v1/attempts?user_id=eq.{user_id}", headers=headers)
requests.delete(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{user_id}", headers=headers)

# Get a question mapped to concept 107
res_qc = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts?concept_id=eq.107&limit=1", headers=headers)
qc = res_qc.json()[0]
qid = qc['question_id']
print(f"[+] Found question {qid} mapped to concept 107")

# Insert attempt
attempt_payload = {
    "user_id": user_id,
    "question_id": qid,
    "session_id": "9999",
    "selected_option": "A",
    "is_correct": True,
    "time_taken_ms": 30000,
    "attempt_order": 1
}

print("[*] Inserting attempt...")
res_ins = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=attempt_payload)
print("Insert status:", res_ins.status_code)
print("Insert response:", res_ins.text)

# Check concept mastery
print("[*] Checking concept mastery...")
res_cm = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{user_id}", headers=headers)
print("Mastery status:", res_cm.status_code)
print("Mastery response:", json.dumps(res_cm.json(), indent=2))
