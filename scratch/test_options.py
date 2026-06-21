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

try:
    # OPTIONS request to get table definition
    response = requests.options(f"{SUPABASE_URL}/rest/v1/questions", headers=headers)
    print("OPTIONS status code:", response.status_code)
    if response.status_code == 200:
        print("Response headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
        try:
            print("\nResponse body (JSON):")
            print(response.json())
        except Exception:
            print("Response body is not JSON or empty.")
    else:
        print("OPTIONS failed:", response.text)
except Exception as e:
    print("Error doing OPTIONS:", e)
