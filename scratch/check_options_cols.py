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
}

# Test if option_label or option_letter or is_correct or option_text exists
candidates = ["id", "question_id", "option_label", "option_letter", "option_text", "is_correct"]
for c in candidates:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/question_options", headers=headers, json={c: None})
    if "Could not find the" in res.text:
        print(f"Column '{c}': DOES NOT EXIST")
    else:
        print(f"Column '{c}': EXISTS (status: {res.status_code}, response: {res.text[:100]})")
