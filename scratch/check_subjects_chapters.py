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

# 1. Fetch subjects
res_subj = requests.get(f"{SUPABASE_URL}/rest/v1/subjects", headers=headers)
print("Subjects:")
if res_subj.status_code == 200:
    print(json.dumps(res_subj.json(), indent=2))
else:
    print("Failed to fetch subjects:", res_subj.text)

# 2. Fetch chapters
res_chap = requests.get(f"{SUPABASE_URL}/rest/v1/chapters", headers=headers)
print("\nChapters:")
if res_chap.status_code == 200:
    print(json.dumps(res_chap.json(), indent=2))
else:
    print("Failed to fetch chapters:", res_chap.text)
