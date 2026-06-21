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
    "Prefer": "return=representation"
}

# Fetch a valid question ID
res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=1", headers=headers)
questions = res_q.json()
q_id = questions[0]["id"]

# Test 1: Insert with invalid UUID format "user_2test"
payload1 = {
    "user_id": "user_2test_dummy_clerk_id",
    "question_id": q_id,
    "session_id": "123",
    "selected_option": "B",
    "is_correct": False,
    "time_taken_ms": 12000,
    "changed_answer_count": 1,
    "opened_hint": False,
    "opened_solution": False,
    "confidence_rating": 3,
    "attempt_order": 1
}

res1 = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payload1)
print("Test 1 (Raw Clerk ID):")
print("  Status:", res1.status_code)
print("  Response:", res1.text)

# Test 2: Insert with a valid UUID format
payload2 = payload1.copy()
payload2["user_id"] = "00000000-0000-0000-0000-000000000000"

res2 = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payload2)
print("\nTest 2 (Valid UUID):")
print("  Status:", res2.status_code)
print("  Response:", res2.text)
