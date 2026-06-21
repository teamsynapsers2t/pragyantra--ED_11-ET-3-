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
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

def rpc(func_name, params={}):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{func_name}", headers=headers, json=params)
    return r.status_code, r.text

def sql_query(query):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=headers,
        json={"query": query}
    )
    return r.status_code, r.text

print("=" * 60)
print("MASTERY SCALE + TRIGGER AUDIT")
print("=" * 60)

# Fetch all concept_mastery rows (all users)
r = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery?select=user_id,concept_id,mastery_score,confidence_score,total_attempts,total_correct", headers=headers)
rows = r.json() if r.status_code == 200 else []

print(f"\n[A] concept_mastery - raw values ({len(rows)} rows total)")
print(f"    Checking scale: expected 0-100 (integers) vs 0-1 (decimals)")
for row in rows:
    ms = row.get('mastery_score', 0)
    ta = row.get('total_attempts', 0)
    tc = row.get('total_correct', 0)
    expected_0_100 = round((tc / ta) * 100) if ta > 0 else 0
    expected_0_1   = round((tc / ta), 4) if ta > 0 else 0
    scale_verdict = "UNKNOWN"
    if abs(ms - expected_0_100) < 2:
        scale_verdict = "0-100 SCALE (correct)"
    elif abs(ms - expected_0_1) < 0.01:
        scale_verdict = "0-1 SCALE (BUG)"
    print(f"  user=...{str(row['user_id'])[-8:]}  concept={row['concept_id']:>3}  stored={ms:>8}  expected_0-100={expected_0_100:>5}  expected_0-1={expected_0_1:.4f}  --> {scale_verdict}")

# Check thresholds with actual stored values
print(f"\n[B] Threshold simulation with ACTUAL stored values")
print(f"    Threshold in SQL fn_detect_root_flaws:")
print(f"      candidate gate : mastery_score < 50  AND confidence_score >= 30")
print(f"      trigger gate   : parent_mastery < 60 AND root_flaw_score >= 400 AND parent_confidence >= 30")
print(f"      root_flaw_score: (100 - parent_mastery) * relationship_strength")

for row in rows:
    ms = row.get('mastery_score', 0)
    cs = row.get('confidence_score', 0)
    cid = row.get('concept_id')
    ta = row.get('total_attempts', 0)
    tc = row.get('total_correct', 0)
    
    if cid in [17, 26] and ta >= 5:
        passes_candidate = ms < 50 and cs >= 30
        print(f"\n  concept_id={cid}  mastery={ms}  confidence={cs}  attempts={ta}")
        print(f"    candidate gate (mastery<50 AND conf>=30): {'PASS' if passes_candidate else 'FAIL'}")
        if ms > 1:
            print(f"    NOTE: mastery={ms} looks like 0-100 scale -> correct")
        else:
            print(f"    NOTE: mastery={ms} looks like 0-1 scale -> root_flaw_score will be ~{(100-ms)*8:.1f} (inflated but passes >= 400)")

# Check if fn_apply_attempt trigger exists 
print(f"\n[C] Checking DB trigger and functions via information_schema")
r2 = requests.get(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers
)
print(f"  exec_sql RPC available: {r2.status_code}")

# Try to query pg_proc directly
r3 = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"query": "SELECT proname FROM pg_proc WHERE proname IN ('fn_apply_attempt','fn_detect_root_flaws','fn_update_concept_mastery') ORDER BY proname;"}
)
print(f"  pg_proc query status: {r3.status_code}")
if r3.status_code == 200:
    print(f"  Functions found: {r3.text}")
else:
    print(f"  pg_proc error: {r3.text[:200]}")

print("\n[D] Current weakness_signals (root_flaw only)")
r4 = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals?signal=eq.root_flaw&select=id,user_id,concept_id,severity,severity_score,confidence_score,created_at", headers=headers)
if r4.status_code == 200:
    sigs = r4.json()
    print(f"  root_flaw signals: {len(sigs)}")
    for s in sigs:
        print(f"    id={s['id']}  concept_id={s['concept_id']}  severity={s['severity']}  score={s['severity_score']}")
else:
    print(f"  Error: {r4.text[:200]}")

print("\n[E] Checking mastery_score column type in DB")
r5 = requests.get(
    f"{SUPABASE_URL}/rest/v1/concept_mastery?select=mastery_score&limit=1",
    headers={**headers, "Accept": "application/json", "Prefer": "return=representation"}
)
print(f"  Sample mastery_score value: {r5.json()[0]['mastery_score'] if r5.status_code==200 and r5.json() else 'N/A'}")
print(f"  (If decimal fraction like 0.21 -> stored as 0-1 scale)")
print(f"  (If integer like 21 -> stored as 0-100 scale)")

print("\n" + "=" * 60)
