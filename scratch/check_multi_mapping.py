"""Check how questions mapped to concept 107 also map to other concepts.
This explains why the trigger creates mastery for concepts 5,6,7,14 instead of 107."""
import os, requests
from collections import Counter

def load_env():
    env = {}
    with open(".env.local", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    env[parts[0].strip()] = parts[1].strip().strip('"').strip("'")
    return env

env = load_env()
URL = env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

# Get all questions mapped to concept 107
res = requests.get(f"{URL}/rest/v1/question_concepts",
    headers=headers, params={"concept_id": "eq.107", "select": "question_id"})
q107_ids = [m['question_id'] for m in res.json()]
print(f"Questions mapped to concept 107: {len(q107_ids)}")
print(f"  IDs: {q107_ids[:10]}...")

# For EACH of those questions, find ALL concept mappings
res2 = requests.get(f"{URL}/rest/v1/question_concepts",
    headers=headers,
    params={"question_id": f"in.({','.join(map(str, q107_ids))})", "select": "question_id,concept_id", "limit": "500"})
all_maps = res2.json()
print(f"\nTotal mappings for these {len(q107_ids)} questions: {len(all_maps)}")

# Count how many concepts each question maps to
from collections import defaultdict
q_to_concepts = defaultdict(list)
for m in all_maps:
    q_to_concepts[m['question_id']].append(m['concept_id'])

print("\nPer-question concept mapping:")
for qid in q107_ids[:10]:
    concepts = q_to_concepts[qid]
    print(f"  Question {qid} -> concepts: {concepts}")

# Count which concepts appear most (the trigger picks one of these)
all_concept_ids = [m['concept_id'] for m in all_maps]
concept_freq = Counter(all_concept_ids)
print(f"\nConcept frequency across these questions:")
for cid, count in concept_freq.most_common(15):
    print(f"  Concept {cid}: appears in {count} of {len(q107_ids)} questions")

# KEY QUESTION: Does concept 107 appear first or last in the mapping table?
print("\nMapping order for first question:")
first_q = q107_ids[0]
maps_for_first = [(m['concept_id'], m) for m in all_maps if m['question_id'] == first_q]
for cid, m in maps_for_first:
    print(f"  concept_id={cid}")
