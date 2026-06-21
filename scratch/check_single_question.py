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

print("--- Querying first few question_concepts ---")
res_qc = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts?limit=5", headers=headers)
print("status:", res_qc.status_code)
print("data:", json.dumps(res_qc.json(), indent=2))

if res_qc.status_code == 200 and len(res_qc.json()) > 0:
    first_qc = res_qc.json()[0]
    qid = first_qc['question_id']
    print(f"\n--- Querying question with ID={qid} ---")
    res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?id=eq.{qid}", headers=headers)
    print("status:", res_q.status_code)
    print("data:", json.dumps(res_q.json(), indent=2))
