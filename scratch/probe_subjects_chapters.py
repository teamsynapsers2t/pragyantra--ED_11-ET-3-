import os
import requests
import sys

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

# Fetch all questions' basic info
url = f"{SUPABASE_URL}/rest/v1/questions?select=id,chapter_id,difficulty,year,exam_type,question_type"
print("Requesting:", url)
res = requests.get(url, headers=headers)
print("Status code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print(f"Total questions fetched: {len(data)}")
    
    # Let's count unique values of each column
    chapter_ids = {}
    difficulties = {}
    years = {}
    exam_types = {}
    question_types = {}
    
    for row in data:
        cid = row.get("chapter_id")
        diff = row.get("difficulty")
        yr = row.get("year")
        et = row.get("exam_type")
        qt = row.get("question_type")
        
        chapter_ids[cid] = chapter_ids.get(cid, 0) + 1
        difficulties[diff] = difficulties.get(diff, 0) + 1
        years[yr] = years.get(yr, 0) + 1
        exam_types[et] = exam_types.get(et, 0) + 1
        question_types[qt] = question_types.get(qt, 0) + 1
        
    print("\nChapter IDs:")
    for cid, count in sorted(chapter_ids.items()):
        print(f"  ID {cid}: {count} questions")
        
    print("\nDifficulties:")
    for diff, count in sorted(difficulties.items()):
        print(f"  {diff}: {count}")
        
    print("\nYears:")
    for yr, count in sorted(years.items(), reverse=True):
        print(f"  {yr}: {count}")
        
    print("\nExam Types:")
    for et, count in sorted(exam_types.items()):
        print(f"  {et}: {count}")
        
    print("\nQuestion Types:")
    for qt, count in sorted(question_types.items()):
        print(f"  {qt}: {count}")

else:
    print("Failed to fetch questions:", res.text)
