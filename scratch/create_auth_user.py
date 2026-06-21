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

# Supabase Auth Admin API endpoint to create a user
url = f"{SUPABASE_URL}/auth/v1/admin/users"
payload = {
    "id": "d0000000-0000-0000-0000-000000000123",
    "email": "test@example.com",
    "password": "Password123!",
    "email_confirm": True
}

res = requests.post(url, headers=headers, json=payload)
print("Status Code:", res.status_code)
print("Response:", res.text)
