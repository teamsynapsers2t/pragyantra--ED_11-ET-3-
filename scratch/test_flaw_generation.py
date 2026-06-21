import os
import requests
import json

def load_env():
    env = {}
    for path in [".env", ".env.local"]:
        if os.path.exists(path):
            with open(path, "r") as f:
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

if not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY not found in env.")
    exit(1)

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

# We will use a dedicated test user ID
TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"

# Concepts:
# 17: Newton's Laws of Motion (Parent)
# 26: Momentum (Child)
child_id = 26
parent_id = 17

# Questions:
child_qs = [46, 47, 48, 49, 50, 53]
parent_qs = [26, 27, 28, 29, 30, 31]

def setup_user():
    # Insert user in users table to satisfy foreign key constraints if needed
    # First check if public.users exists and has RLS
    url = f"{SUPABASE_URL}/rest/v1/users"
    payload = {"id": TEST_USER_UUID}
    res = requests.post(url, headers={**headers, "Prefer": "resolution=merge-duplicates"}, json=payload)
    print(f"Ensuring test user exists in public.users: status={res.status_code}")

def clean_data():
    print("\n--- Cleaning up previous test data ---")
    
    # Clean attempts
    res = requests.delete(f"{SUPABASE_URL}/rest/v1/attempts?user_id=eq.{TEST_USER_UUID}", headers=headers)
    print(f"Deleted attempts: status={res.status_code}")
    
    # Clean concept_mastery
    res = requests.delete(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{TEST_USER_UUID}", headers=headers)
    print(f"Deleted concept_mastery: status={res.status_code}")
    
    # Clean weakness_signals
    res = requests.delete(f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}", headers=headers)
    print(f"Deleted weakness_signals: status={res.status_code}")

def check_prerequisites():
    print("\n--- Checking Prerequisites in DB ---")
    url = f"{SUPABASE_URL}/rest/v1/concept_prerequisites?concept_id=eq.{child_id}&requires_concept_id=eq.{parent_id}"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print("Prerequisite mapping:")
        print(json.dumps(data, indent=2))
        return len(data) > 0
    else:
        print(f"Error querying prerequisites: {res.status_code} - {res.text}")
        return False

def insert_attempts(concept_name, question_ids, correct_count, total_count):
    print(f"\n--- Inserting {total_count} attempts for {concept_name} (Concept ID: {question_ids[0]}...) ---")
    attempts = []
    for i in range(total_count):
        attempts.append({
            "user_id": TEST_USER_UUID,
            "question_id": question_ids[i % len(question_ids)],
            "session_id": "99999",
            "selected_option": "A",
            "is_correct": i < correct_count,
            "time_taken_ms": 30000,
            "attempt_order": 1,
            "created_at": "2026-06-19T10:00:00Z"
        })
    
    url = f"{SUPABASE_URL}/rest/v1/attempts"
    res = requests.post(url, headers=headers, json=attempts)
    print(f"Inserted attempts: status={res.status_code}")
    if res.status_code not in [200, 201]:
        print(res.text)

def check_database_state():
    print("\n--- Checking concept_mastery state ---")
    url = f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{TEST_USER_UUID}&concept_id=in.({child_id},{parent_id})"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {res.status_code} - {res.text}")

    print("\n--- Checking weakness_signals state ---")
    url = f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {res.status_code} - {res.text}")

def run():
    setup_user()
    clean_data()
    prereq_exists = check_prerequisites()
    
    # 1. Solve 10 Newton's Laws questions (Concept 17) incorrectly
    # Let's do 1 correct out of 10 (10% mastery, below threshold)
    insert_attempts("Newton's Laws of Motion (Parent)", parent_qs, 1, 10)
    
    # 2. Solve 10 Momentum questions (Concept 26) incorrectly
    # Let's do 1 correct out of 10
    insert_attempts("Momentum (Child)", child_qs, 1, 10)
    
    # 3. Check database state
    check_database_state()

if __name__ == "__main__":
    run()
