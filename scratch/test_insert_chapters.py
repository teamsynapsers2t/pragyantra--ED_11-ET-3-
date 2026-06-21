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

# Delete all first
requests.delete(f"{SUPABASE_URL}/rest/v1/chapters?id=not.is.null", headers=headers)

# Insert one chapter
res = requests.post(f"{SUPABASE_URL}/rest/v1/chapters", headers=headers, json={
    "chapter_name": "Test Chapter",
    "subject": "Physics"
})

print("Status Code:", res.status_code)
if res.status_code in [200, 201]:
    print("Inserted chapter representation:")
    print(res.json())
else:
    print("Error:", res.text)
