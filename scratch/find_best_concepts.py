"""Find which concepts have the most questions mapped, to pick good test concepts for audit."""
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

# Fetch all question-concept mappings
res = requests.get(f"{SUPABASE_URL}/rest/v1/question_concepts?select=question_id,concept_id&limit=2000", headers=headers)
mappings = res.json()
print(f"Total mappings: {len(mappings)}")

# Count questions per concept
from collections import Counter
concept_counts = Counter(m['concept_id'] for m in mappings)
print("\nTop concepts by mapped question count:")
for cid, count in concept_counts.most_common(20):
    print(f"  Concept {cid}: {count} questions")

# Fetch concept names for top concepts
top_ids = [cid for cid, _ in concept_counts.most_common(20)]
res_c = requests.get(f"{SUPABASE_URL}/rest/v1/concepts?id=in.({','.join(map(str, top_ids))}&select=id,concept_name", headers=headers)
if res_c.status_code == 200:
    concepts = {c['id']: c['concept_name'] for c in res_c.json()}
    print("\nTop concepts with names:")
    for cid, count in concept_counts.most_common(20):
        print(f"  Concept {cid} ({concepts.get(cid, '?')}): {count} questions")
