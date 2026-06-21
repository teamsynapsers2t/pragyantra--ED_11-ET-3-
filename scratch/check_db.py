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

def query_table(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?limit=10"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        return res.json()
    else:
        return f"Error {res.status_code}: {res.text}"

print("=== User Profiles ===")
print(query_table("user_profiles"))

print("\n=== Weakness Signals ===")
print(query_table("weakness_signals"))

print("\n=== Concept Mastery ===")
print(query_table("concept_mastery"))

print("\n=== Attempts Count ===")
count_url = f"{SUPABASE_URL}/rest/v1/attempts?select=count"
res = requests.get(count_url, headers={**headers, "Prefer": "count=exact"})
if res.status_code == 200:
    print(res.headers.get("Content-Range"))
else:
    print(f"Error {res.status_code}: {res.text}")
