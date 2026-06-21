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
    "Prefer": "count=exact"
}

possible_tables = [
    "questions", "question_options", "question_concepts", "question_concept",
    "concepts", "concept", "sub_concepts", "sub_concept", "topics", "topic",
    "subtopics", "subtopic", "sub_topics", "sub_topic", "chapters", "chapter",
    "subjects", "subject", "question_tags", "question_tag", "tags", "tag",
    "question_mapping", "question_mappings", "mappings", "mapping",
    "chapter_concepts", "chapter_concept", "units", "unit", "dimensions",
    "units_dimensions", "physics_concepts", "physics_concept"
]

found_tables = []
for table in possible_tables:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=1", headers=headers)
    if res.status_code in [200, 204, 206]:
        content_range = res.headers.get("Content-Range")
        total_rows = content_range.split("/")[-1] if content_range else "unknown"
        print(f"Table '{table}' EXISTS: status={res.status_code}, rows={total_rows}")
        found_tables.append((table, total_rows))
    elif res.status_code != 404:
        print(f"Table '{table}' returned status {res.status_code}: {res.text[:150]}")

print("\nSummary of found tables:")
for t, r in found_tables:
    print(f"  {t} ({r} rows)")
