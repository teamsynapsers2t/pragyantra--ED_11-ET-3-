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

print("Fetching sub_concepts where chapter_id = 2:")
res = requests.get(f"{SUPABASE_URL}/rest/v1/sub_concepts?chapter_id=eq.2", headers=headers)
print("status:", res.status_code)
if res.status_code == 200:
    print("sub_concepts:", json.dumps(res.json(), indent=2))
else:
    print("error:", res.text)

print("\nFetching question_concepts:")
res = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts?limit=10", headers=headers)
print("status:", res.status_code)
if res.status_code == 200:
    print("question_concepts:", json.dumps(res.json(), indent=2))
else:
    print("error:", res.text)

print("\nFetching concepts:")
res = requests.get(f"{SUPABASE_URL}/rest/v1/concepts?limit=10", headers=headers)
print("status:", res.status_code)
if res.status_code == 200:
    print("concepts:", json.dumps(res.json(), indent=2))
else:
    print("error:", res.text)
