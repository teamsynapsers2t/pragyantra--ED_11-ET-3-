"""
validate_root_flaw_fix.py
─────────────────────────
After running sql/fix_root_flaw_direction.sql in the Supabase SQL Editor,
run this script to confirm the bug is fixed.

Expected result:
  - ONE root_flaw signal under concept_id = 26  (Momentum = child)
  - evidence.root_concept_id = 17              (Newton's Laws = parent)
  - evidence.root_concept_name = "Newton's Laws of Motion"
"""

import os
import json
import requests

def load_env():
    env = {}
    for path in [".env", ".env.local"]:
        if os.path.exists(path):
            with open(path, "r") as f:
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
SUPABASE_URL     = env.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_KEY      = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"
CHILD_CONCEPT  = 26   # Momentum
PARENT_CONCEPT = 17   # Newton's Laws of Motion
CHILD_QS       = [46, 47, 48, 49, 50, 53]
PARENT_QS      = [26, 27, 28, 29, 30, 31]


def setup_user():
    print("=== Setting up test user ===")
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/users?on_conflict=id",
        headers={**headers, "Prefer": "resolution=merge-duplicates"},
        json={"id": TEST_USER_UUID},
    )
    print(f"  User: {res.status_code} {res.text[:80]}")


def clean_data():
    print("=== Cleaning old test data ===")
    for table in ["attempts", "concept_mastery", "weakness_signals", "sessions"]:
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/{table}?user_id=eq.{TEST_USER_UUID}",
            headers=headers,
        )
    print("  Done.")


def insert_attempts():
    print("=== Inserting wrong attempts ===")
    # 10 wrong for parent (concept 17)
    parent_attempts = [
        {
            "user_id":       TEST_USER_UUID,
            "question_id":   PARENT_QS[i % len(PARENT_QS)],
            "session_id":    None,
            "selected_option": "A",
            "is_correct":    False,
            "time_taken_ms": 30000,
            "attempt_order": 1,
            "created_at":    "2026-06-19T10:05:00Z",
        }
        for i in range(10)
    ]
    # 10 wrong for child (concept 26)
    child_attempts = [
        {
            "user_id":       TEST_USER_UUID,
            "question_id":   CHILD_QS[i % len(CHILD_QS)],
            "session_id":    None,
            "selected_option": "A",
            "is_correct":    False,
            "time_taken_ms": 30000,
            "attempt_order": 1,
            "created_at":    "2026-06-19T10:10:00Z",
        }
        for i in range(10)
    ]
    r1 = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=parent_attempts)
    r2 = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=child_attempts)
    print(f"  Parent attempts: {r1.status_code}  Child attempts: {r2.status_code}")


def call_report_rpc():
    print("=== Calling fn_generate_weakness_report ===")
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/fn_generate_weakness_report",
        headers=headers,
        json={"p_user_id": TEST_USER_UUID},
    )
    print(f"  Status: {res.status_code}  Body: {res.text[:120]}")


def validate():
    print("\n=== Fetching root_flaw signals ===")
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/weakness_signals"
        f"?user_id=eq.{TEST_USER_UUID}&signal=eq.root_flaw",
        headers=headers,
    )
    signals = res.json()
    print(f"  Total root_flaw signals: {len(signals)}")

    passed = True
    for sig in signals:
        ev = sig.get("evidence", {})
        if isinstance(ev, str):
            ev = json.loads(ev)

        concept_id       = sig.get("concept_id")
        root_concept_id  = ev.get("root_concept_id")
        root_concept_name = ev.get("root_concept_name", "")

        print(f"\n  Signal ID: {sig.get('id')}")
        print(f"    concept_id (child)  : {concept_id}")
        print(f"    root_concept_id     : {root_concept_id}")
        print(f"    root_concept_name   : {root_concept_name}")
        print(f"    severity            : {sig.get('severity')}")
        print(f"    severity_score      : {sig.get('severity_score')}")
        print(f"    Full evidence       : {json.dumps(ev, indent=6)}")

        # Assertion 1: Signal is under the CHILD concept (26)
        if concept_id == CHILD_CONCEPT:
            print(f"  ✓ PASS: concept_id == {CHILD_CONCEPT} (Momentum = child)")
        else:
            print(f"  ✗ FAIL: concept_id = {concept_id}, expected {CHILD_CONCEPT}")
            passed = False

        # Assertion 2: Root cause is the PARENT concept (17)
        if root_concept_id == PARENT_CONCEPT:
            print(f"  ✓ PASS: root_concept_id == {PARENT_CONCEPT} (Newton's Laws = parent)")
        else:
            print(f"  ✗ FAIL: root_concept_id = {root_concept_id}, expected {PARENT_CONCEPT}")
            passed = False

        # Assertion 3: root_concept_name is not empty/Concept#
        if root_concept_name and "Concept #" not in root_concept_name:
            print(f"  ✓ PASS: root_concept_name = '{root_concept_name}'")
        else:
            print(f"  ✗ FAIL: root_concept_name = '{root_concept_name}' (missing or fallback)")
            passed = False

        # Assertion 4: severity is lowercase
        if sig.get("severity") in ("low", "medium", "high"):
            print(f"  ✓ PASS: severity is lowercase ({sig.get('severity')})")
        else:
            print(f"  ✗ FAIL: severity = '{sig.get('severity')}' (not lowercase)")
            passed = False

    print()
    if len(signals) == 0:
        print("✗ FAIL: No root_flaw signals generated at all.")
        passed = False
    elif passed:
        print("══════════════════════════════════════════")
        print("✓ ALL ASSERTIONS PASSED — Root Flaw Bug Fixed!")
        print("══════════════════════════════════════════")
    else:
        print("══════════════════════════════════════════")
        print("✗ SOME ASSERTIONS FAILED — Review output above.")
        print("══════════════════════════════════════════")


if __name__ == "__main__":
    setup_user()
    clean_data()
    insert_attempts()
    call_report_rpc()
    validate()
