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
url = env.get("NEXT_PUBLIC_SUPABASE_URL")
key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

# Test attempts columns
res1 = requests.get(f"{url}/rest/v1/attempts?select=numerical_response&limit=1", headers=headers)
print("attempts.numerical_response check:")
print("Status:", res1.status_code)
print("Response:", res1.text)

# Test sessions columns
res2 = requests.get(f"{url}/rest/v1/sessions?select=metadata&limit=1", headers=headers)
print("\nsessions.metadata check:")
print("Status:", res2.status_code)
print("Response:", res2.text)
