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
SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
}

res = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
if res.status_code == 200:
    spec = res.json()
    with open("c:\\Users\\tumra\\Documents\\paper-AI\\paper-ai\\scratch\\supabase_openapi.json", "w") as f:
        json.dump(spec, f, indent=2)
    print("Successfully saved OpenAPI spec to scratch/supabase_openapi.json")
    
    # Print paths and definitions
    print("\nPaths found:")
    for path in spec.get("paths", {}).keys():
        print(f"  - {path}")
else:
    print(f"Error: {res.status_code} - {res.text}")
