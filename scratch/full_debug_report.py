import os
import requests
import json

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
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_ANON_KEY)

headers_anon = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}
headers_service = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
}

def get(path, headers=headers_service, params=None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params)
    if r.status_code == 200:
        return r.json()
    else:
        print(f"  ERROR {r.status_code}: {r.text}")
        return []

print("=" * 60)
print("FULL ROOT FLAW DEBUG REPORT")
print("=" * 60)

# 1. concept_mastery
print("\n[1] concept_mastery (all rows)")
mastery_rows = get("concept_mastery?select=user_id,concept_id,mastery_score,confidence_score,weakness_level,total_attempts")
for r in mastery_rows:
    flag = ""
    # candidate gate: mastery_score < 50 AND confidence_score >= 30
    if r.get("mastery_score", 999) < 50 and r.get("confidence_score", 0) >= 30:
        flag = " ✅ CANDIDATE"
    elif r.get("mastery_score", 999) < 50 and r.get("confidence_score", 0) < 30:
        flag = " ❌ mastery weak but confidence TOO LOW (<30)"
    print(f"  concept_id={r['concept_id']}  mastery={r['mastery_score']}  confidence={r['confidence_score']}  weakness_level={r.get('weakness_level')}  attempts={r.get('total_attempts')}{flag}")

# 2. Check concept 26 and 17 specifically
print("\n[2] Checking concept 26 and 17 in concept_mastery")
for cid in [17, 26]:
    rows = [r for r in mastery_rows if r.get('concept_id') == cid]
    if rows:
        for r in rows:
            print(f"  concept_id={cid}: mastery={r['mastery_score']}, confidence={r['confidence_score']}, attempts={r.get('total_attempts')}")
            # Candidate gate
            if r['mastery_score'] < 50 and r['confidence_score'] >= 30:
                print(f"    → ✅ Passes candidate gate (mastery<50 AND confidence>=30)")
            else:
                reasons = []
                if not (r['mastery_score'] < 50):
                    reasons.append(f"mastery {r['mastery_score']} NOT < 50")
                if not (r['confidence_score'] >= 30):
                    reasons.append(f"confidence {r['confidence_score']} NOT >= 30")
                print(f"    → ❌ FAILS candidate gate: {' | '.join(reasons)}")
    else:
        print(f"  concept_id={cid}: NOT FOUND in concept_mastery for any user")

# 3. concept_prerequisites for concept 26
print("\n[3] concept_prerequisites WHERE concept_id=26")
prereqs = get("concept_prerequisites?concept_id=eq.26")
if prereqs:
    for p in prereqs:
        print(f"  → requires concept_id={p['requires_concept_id']}, strength={p['relationship_strength']}")
else:
    print("  ❌ NO ROWS FOUND — prerequisite 26->17 is MISSING from DB!")

# 4. Simulate root flaw score
print("\n[4] Root Flaw Score Simulation (concept 26 -> concept 17)")
concept_17 = next((r for r in mastery_rows if r.get('concept_id') == 17), None)
concept_26 = next((r for r in mastery_rows if r.get('concept_id') == 26), None)
prereq_26 = next((p for p in prereqs if p.get('requires_concept_id') == 17), None) if prereqs else None

if concept_26 and concept_17 and prereq_26:
    child_mastery = concept_26['mastery_score']
    parent_mastery = concept_17['mastery_score']
    parent_confidence = concept_17['confidence_score']
    child_confidence = concept_26['confidence_score']
    strength = prereq_26['relationship_strength']
    root_flaw_score = (100 - parent_mastery) * strength

    print(f"  child_mastery (concept 26)   = {child_mastery}  → < 50? {'✅' if child_mastery < 50 else '❌'}")
    print(f"  parent_mastery (concept 17)  = {parent_mastery}  → < 60? {'✅' if parent_mastery < 60 else '❌'}")
    print(f"  parent_confidence            = {parent_confidence}  → >= 30? {'✅' if parent_confidence >= 30 else '❌'}")
    print(f"  child_confidence             = {child_confidence}  → >= 30? {'✅' if child_confidence >= 30 else '❌'}")
    print(f"  relationship_strength        = {strength}")
    print(f"  root_flaw_score = (100 - {parent_mastery}) × {strength} = {root_flaw_score}  → >= 400? {'✅' if root_flaw_score >= 400 else '❌'}")

    all_pass = (child_mastery < 50 and parent_mastery < 60 and
                parent_confidence >= 30 and child_confidence >= 30 and root_flaw_score >= 400)
    print(f"\n  VERDICT: {'✅ ROOT FLAW SHOULD TRIGGER' if all_pass else '❌ ROOT FLAW WILL NOT TRIGGER'}")
    if not all_pass:
        fails = []
        if not (child_mastery < 50): fails.append(f"child_mastery {child_mastery} not < 50")
        if not (parent_mastery < 60): fails.append(f"parent_mastery {parent_mastery} not < 60")
        if not (parent_confidence >= 30): fails.append(f"parent_confidence {parent_confidence} not >= 30")
        if not (child_confidence >= 30): fails.append(f"child_confidence {child_confidence} not >= 30")
        if not (root_flaw_score >= 400): fails.append(f"root_flaw_score {root_flaw_score} not >= 400")
        print(f"  FAILING CONDITIONS: {' | '.join(fails)}")
else:
    print(f"  Cannot simulate — missing data:")
    print(f"    concept_26 mastery record: {'FOUND' if concept_26 else 'MISSING'}")
    print(f"    concept_17 mastery record: {'FOUND' if concept_17 else 'MISSING'}")
    print(f"    prereq row 26->17: {'FOUND' if prereq_26 else 'MISSING'}")

# 5. weakness_signals
print("\n[5] weakness_signals (all rows)")
signals = get("weakness_signals?select=user_id,concept_id,signal,severity,severity_score,confidence_score,created_at")
if signals:
    for s in signals:
        print(f"  concept_id={s['concept_id']}  signal={s['signal']}  severity={s['severity']}  severity_score={s['severity_score']}  confidence={s['confidence_score']}")
else:
    print("  ❌ NO weakness signals in DB at all")

# 6. attempts summary
print("\n[6] Attempts summary by concept")
qc_rows = get("question_concepts?select=question_id,concept_id")
qc_map = {r['question_id']: r['concept_id'] for r in qc_rows}
attempts = get("attempts?select=question_id,is_correct,user_id")
concept_attempts = {}
for a in attempts:
    cid = qc_map.get(a['question_id'])
    if cid:
        if cid not in concept_attempts:
            concept_attempts[cid] = {'total': 0, 'correct': 0}
        concept_attempts[cid]['total'] += 1
        if a['is_correct']:
            concept_attempts[cid]['correct'] += 1

for cid in sorted(concept_attempts.keys()):
    d = concept_attempts[cid]
    print(f"  concept_id={cid}: {d['total']} attempts, {d['correct']} correct ({round(d['correct']/d['total']*100)}%)")

print("\n" + "=" * 60)
print("END REPORT")
print("=" * 60)
