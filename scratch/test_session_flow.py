import os
import requests
import json
import time

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
SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"
child_id = 26
parent_id = 17
child_qs = [46, 47, 48, 49, 50, 53]
parent_qs = [26, 27, 28, 29, 30, 31]

def clean_data():
    print("Cleaning up old data...")
    requests.delete(f"{SUPABASE_URL}/rest/v1/attempts?user_id=eq.{TEST_USER_UUID}", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{TEST_USER_UUID}", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}", headers=headers)
    requests.delete(f"{SUPABASE_URL}/rest/v1/sessions?user_id=eq.{TEST_USER_UUID}", headers=headers)

def run():
    clean_data()
    
    # 1. Create a session in the database
    print("\n--- Starting Session ---")
    session_payload = {
        "user_id": TEST_USER_UUID,
        "started_at": "2026-06-19T10:00:00Z"
    }
    res_sess = requests.post(f"{SUPABASE_URL}/rest/v1/sessions", headers={**headers, "Prefer": "return=representation"}, json=session_payload)
    if res_sess.status_code not in [200, 201]:
        print(f"Failed to create session: {res_sess.text}")
        return
    session = res_sess.json()[0]
    session_id = session["id"]
    print(f"Session created with ID: {session_id}")
    
    # 2. Insert 10 wrong attempts for Parent (Concept 17)
    print("\n--- Submitting attempts for Concept 17 (Parent) ---")
    parent_attempts = []
    for i in range(10):
        parent_attempts.append({
            "user_id": TEST_USER_UUID,
            "question_id": parent_qs[i % len(parent_qs)],
            "session_id": str(session_id),
            "selected_option": "A",
            "is_correct": False,
            "time_taken_ms": 30000,
            "attempt_order": 1,
            "created_at": "2026-06-19T10:05:00Z"
        })
    requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=parent_attempts)
    
    # 3. Insert 10 wrong attempts for Child (Concept 26)
    print("\n--- Submitting attempts for Concept 26 (Child) ---")
    child_attempts = []
    for i in range(10):
        child_attempts.append({
            "user_id": TEST_USER_UUID,
            "question_id": child_qs[i % len(child_qs)],
            "session_id": str(session_id),
            "selected_option": "A",
            "is_correct": False,
            "time_taken_ms": 30000,
            "attempt_order": 1,
            "created_at": "2026-06-19T10:10:00Z"
        })
    requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=child_attempts)
    
    # 4. Check weakness signals before session end
    print("\n--- Weakness signals before session end ---")
    res_sig_pre = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}", headers=headers)
    print(json.dumps(res_sig_pre.json(), indent=2))
    
    # 5. Call fn_generate_weakness_report RPC manually as if session ended
    print("\n--- Ending Session and calling fn_generate_weakness_report RPC ---")
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/fn_generate_weakness_report"
    res_rpc = requests.post(rpc_url, headers=headers, json={"p_user_id": TEST_USER_UUID})
    print(f"RPC Status Code: {res_rpc.status_code}")
    print(f"RPC Response: {res_rpc.text}")
    
    # 6. Check weakness signals after session end
    print("\n--- Weakness signals after session end ---")
    res_sig_post = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}", headers=headers)
    print(json.dumps(res_sig_post.json(), indent=2))

if __name__ == "__main__":
    run()
