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

# We will try to update a single question (e.g. ID 1239) to various chapter_ids from 1 to 150
# and record which ones are accepted (return 204/200) and which ones fail with a foreign key constraint.
test_qid = 1239

# Store the original chapter_id of this question to restore it later
res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?id=eq.{test_qid}", headers=headers)
if res.status_code != 200 or not res.json():
    print("Failed to fetch test question.")
    exit(1)
original_chapter_id = res.json()[0].get("chapter_id")
print(f"Original chapter_id of question {test_qid} is {original_chapter_id}")

valid_ids = []
invalid_ids = []

print("Probing chapter_ids 1 to 150...")
for cid in range(1, 151):
    patch_res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/questions?id=eq.{test_qid}",
        headers=headers,
        json={"chapter_id": cid}
    )
    if patch_res.status_code in [200, 204]:
        valid_ids.append(cid)
    else:
        invalid_ids.append(cid)

# Restore original chapter_id
requests.patch(
    f"{SUPABASE_URL}/rest/v1/questions?id=eq.{test_qid}",
    headers=headers,
    json={"chapter_id": original_chapter_id}
)

print(f"\nProbing complete!")
print(f"Valid chapter_ids in database's 'chapters' table ({len(valid_ids)}):")
print(valid_ids)
