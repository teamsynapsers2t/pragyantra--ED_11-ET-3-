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

# 1. Fetch question_concepts mappings
res_qc = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts", headers=headers)
mappings = res_qc.json()
qids = list(set([m['question_id'] for m in mappings]))
print(f"Total mapped question IDs from question_concepts: {len(qids)}")

# 2. Fetch questions matching those IDs
# Using POST to /rpc or chunks in GET because 370 IDs might be too long for GET
# Let's chunk the list of question IDs to prevent URI too long
chunk_size = 50
questions_loaded = []
for i in range(0, len(qids), chunk_size):
    chunk = qids[i:i+chunk_size]
    chunk_str = ",".join(map(str, chunk))
    res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?id=in.({chunk_str})", headers=headers)
    if res_q.status_code == 200:
        questions_loaded.extend(res_q.json())
    else:
        print(f"Error for chunk {i}: {res_q.status_code} - {res_q.text}")

print(f"Successfully loaded questions count: {len(questions_loaded)}")
