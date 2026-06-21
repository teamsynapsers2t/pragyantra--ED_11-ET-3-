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

url = f"{SUPABASE_URL}/rest/v1/questions?select=chapter_id,question_type,question_options(id)"
res = requests.get(url, headers=headers)
print("status_code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Fetched", len(data), "rows.")
    if data:
        print("Sample row:", data[0])
        valid_rows = [r for r in data if r.get('question_type') == 'numerical' or (r.get('question_options') and len(r.get('question_options')) > 0)]
        print("Total valid rows (numerical or has options):", len(valid_rows))
        
        # Unique chapter ids among valid rows
        valid_chapters = set(r.get('chapter_id') for r in valid_rows)
        print("Chapters with valid questions:", sorted(list(valid_chapters)))
else:
    print("Failed:", res.text)
