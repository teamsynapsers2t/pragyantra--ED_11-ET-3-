import os
import requests

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
SUPABASE_ANON_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

# Test if 'error_type' column exists in question_options
res = requests.get(f"{SUPABASE_URL}/rest/v1/question_options?select=error_type&limit=1", headers=headers)
print("question_options.error_type check:")
print("Status:", res.status_code)
print("Response:", res.text)

# Test if 'error_type' column exists in attempts
res2 = requests.get(f"{SUPABASE_URL}/rest/v1/attempts?select=error_type&limit=1", headers=headers)
print("\nattempts.error_type check:")
print("Status:", res2.status_code)
print("Response:", res2.text)
