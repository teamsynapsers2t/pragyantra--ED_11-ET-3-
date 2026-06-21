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

# Test if table 'question_stats' exists
res = requests.get(f"{SUPABASE_URL}/rest/v1/question_stats?limit=1", headers=headers)
print("status_code:", res.status_code)
if res.status_code in [200, 206]:
    print("Table 'question_stats' EXISTS!")
    print("Content:", res.json())
elif res.status_code == 404:
    print("Table 'question_stats' does NOT exist (404).")
else:
    print(f"Error checking: {res.status_code} - {res.text}")

# Test columns
candidates = [
    "question_id", "total_attempts", "total_correct", "avg_time_ms", "difficulty_score", "updated_at",
    "n_attempts", "n_correct", "accuracy", "median_time_ms", "p90_time_ms"
]
print("\nTesting columns of 'question_stats':")
for c in candidates:
    r = requests.post(f"{SUPABASE_URL}/rest/v1/question_stats", headers=headers, json={c: None})
    if "Could not find the" in r.text or "column" in r.text.lower() and "does not exist" in r.text.lower():
        print(f"Column '{c}': DOES NOT EXIST (response: {r.text[:100]})")
    else:
        print(f"Column '{c}': EXISTS (status={r.status_code}, response={r.text[:100]})")
