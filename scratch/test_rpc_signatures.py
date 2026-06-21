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

def test_rpc(name, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{name}"
    res = requests.post(url, headers=headers, json=params)
    print(f"RPC {name} with params {list(params.keys())}: status={res.status_code}, response={res.text[:300]}")

# 1. Test fn_apply_attempt
print("--- Probing fn_apply_attempt ---")
# Candidate A: 4 args (p_user_id, p_question_id, p_is_correct, p_time_taken_ms)
test_rpc("fn_apply_attempt", {
    "p_user_id": "00000000-0000-4000-a000-000000000001",
    "p_question_id": 1,
    "p_is_correct": True,
    "p_time_taken_ms": 1000
})
# Candidate B: 1 arg (p_attempt_id)
test_rpc("fn_apply_attempt", {
    "p_attempt_id": 1
})

# 2. Test fn_detect_root_flaws
print("\n--- Probing fn_detect_root_flaws ---")
test_rpc("fn_detect_root_flaws", {
    "p_user_id": "00000000-0000-4000-a000-000000000001"
})

# 3. Test fn_generate_weakness_report
print("\n--- Probing fn_generate_weakness_report ---")
test_rpc("fn_generate_weakness_report", {
    "p_user_id": "00000000-0000-4000-a000-000000000001"
})
