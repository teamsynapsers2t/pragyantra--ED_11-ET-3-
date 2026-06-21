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

# In PostgREST, we can get list of tables by querying the OpenAPI definition, but since that requires service role,
# let's try querying standard endpoints or see what works.
# Wait, let's try calling some table endpoints to check which ones exist.
possible_tables = [
    "questions",
    "chapters",
    "subjects",
    "topics",
    "physics",
    "physics_chapters",
    "physics_questions",
    "question",
    "jee_questions",
    "user_profiles",
    "user_actions",
    "ai_roadmaps",
    "question_options"
]

for table in possible_tables:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=1", headers=headers)
    print(f"Table '{table}': status_code={res.status_code}")
    if res.status_code == 200:
        try:
            data = res.json()
            print(f"  Columns: {list(data[0].keys()) if data else 'Empty'}")
        except Exception as e:
            print(f"  Error parsing: {e}")
