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

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

def test_user(uuid_str):
    url = f"{SUPABASE_URL}/rest/v1/users?on_conflict=id"
    payload = {"id": uuid_str}
    res = requests.post(url, headers={**headers, "Prefer": "resolution=merge-duplicates"}, json=payload)
    print(f"Testing ID {uuid_str}: status={res.status_code}, response={res.text}")

print("Testing verification user ID:")
test_user("00000000-0000-4000-a000-000000000001")

print("\nTesting attempts user ID:")
test_user("654d8d12-7b13-336b-ca41-462af94d0090")
