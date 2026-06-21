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

columns_to_test = [
    "id", "question_id", "option_text", "option_label", "is_correct", "option_value", 
    "text", "label", "value", "created_at", "updated_at", "option_index"
]

for col in columns_to_test:
    res = requests.post(f"{SUPABASE_URL}/rest/v1/question_options", headers=headers, json={col: None})
    if "Could not find the" in res.text and col in res.text:
        print(f"Column '{col}': DOES NOT EXIST")
    else:
        print(f"Column '{col}': EXISTS (Response: {res.status_code} - {res.text[:100]})")
