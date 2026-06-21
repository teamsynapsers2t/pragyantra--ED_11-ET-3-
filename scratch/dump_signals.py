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

res = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals?limit=5", headers=headers)
print("Weakness Signals:")
if res.status_code == 200:
    for row in res.json():
        print(f"  Signal: {row.get('signal')}, Severity: {row.get('severity')}, Concept: {row.get('concept_id')}")
        print("  Evidence:", row.get('evidence'))
else:
    print("Error:", res.text)
