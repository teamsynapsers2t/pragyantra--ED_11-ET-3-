"""Get concept names and prerequisites for top concepts."""
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
headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}

# Top concepts from our analysis
TOP_IDS = [107, 98, 33, 72, 26, 68, 92, 117]

# 1. Get concept names
res = requests.get(
    f"{SUPABASE_URL}/rest/v1/concepts",
    headers=headers,
    params={"id": f"in.({','.join(map(str, TOP_IDS))})", "select": "id,concept_name,subject"}
)
print("Concept Names (status:", res.status_code, ")")
data = res.json()
concepts = {}
if isinstance(data, list):
    for c in data:
        concepts[c['id']] = c
        print(f"  {c['id']}: {c.get('concept_name')} (subject={c.get('subject')})")
else:
    print("Error:", data)

# 2. Check prerequisites involving our top concepts
print("\nPrerequisites involving top concepts:")
res_p = requests.get(
    f"{SUPABASE_URL}/rest/v1/concept_prerequisites?select=concept_id,requires_concept_id,relationship_strength&limit=200",
    headers=headers
)
prereqs = res_p.json()
print(f"Total prerequisites: {len(prereqs)}")
for p in prereqs:
    child = p['concept_id']
    parent = p['requires_concept_id']
    if child in TOP_IDS or parent in TOP_IDS:
        print(f"  Concept {child} requires Concept {parent} (strength={p['relationship_strength']})")

# 3. Also check if concepts 107 and 98 have any prerequisites
print("\nAll prerequisites for concepts 107 and 98:")
res_p2 = requests.get(
    f"{SUPABASE_URL}/rest/v1/concept_prerequisites?concept_id=in.(107,98)&select=concept_id,requires_concept_id,relationship_strength",
    headers=headers
)
print(res_p2.json())
