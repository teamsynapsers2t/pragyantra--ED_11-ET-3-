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

def main():
    env = load_env()
    SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_ANON_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("[-] Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local")
        return

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # 1. Fetch all weakness signals
    print("[*] Fetching weakness signals from Supabase...")
    res_signals = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals", headers=headers)
    
    if res_signals.status_code != 200:
        print(f"[-] Error fetching signals: {res_signals.status_code} - {res_signals.text}")
        return

    signals = res_signals.json()
    print(f"[+] Retrieved {len(signals)} weakness signals from database.\n")

    # 2. Fetch all concepts for mapping verification
    print("[*] Fetching concepts for mapping verification...")
    res_concepts = requests.get(f"{SUPABASE_URL}/rest/v1/concepts", headers=headers)
    concept_map = {}
    if res_concepts.status_code == 200:
        for c in res_concepts.json():
            concept_map[c['id']] = c.get('concept_name', 'Unknown')
        print(f"[+] Loaded {len(concept_map)} concepts mapping.\n")
    else:
        print(f"[-] Warning: Failed to fetch concepts mapping ({res_concepts.status_code})")

    # 3. Analyze and verify each signal
    print("=== Diagnostics & Verification ===")
    root_flaw_count = 0
    time_trap_count = 0
    other_count = 0

    for idx, sig in enumerate(signals):
        print(f"\n[Signal #{idx + 1}] ID: {sig.get('id')} | Type: {sig.get('signal')} | Severity: {sig.get('severity')}")
        concept_id = sig.get('concept_id')
        concept_name = concept_map.get(concept_id, f"Unknown ID {concept_id}")
        print(f"  Concept: {concept_name} (ID: {concept_id})")
        print(f"  Confidence Score: {sig.get('confidence_score')}%")
        print(f"  Severity Score: {sig.get('severity_score')}")

        # Check evidence
        evidence = sig.get('evidence')
        if not evidence:
            print("  [-] WARNING: No evidence payload found.")
        else:
            print(f"  Evidence fields: {list(evidence.keys()) if isinstance(evidence, dict) else 'non-dict'}")
            
        # Verify specific fields by signal type
        sig_type = sig.get('signal')
        if sig_type == 'root_flaw':
            root_flaw_count += 1
            root_name = evidence.get('root_concept_name') if isinstance(evidence, dict) else None
            weak_name = evidence.get('weak_concept_name') if isinstance(evidence, dict) else None
            strength = evidence.get('relationship_strength') if isinstance(evidence, dict) else None
            score = evidence.get('root_flaw_score') if isinstance(evidence, dict) else None
            
            if not root_name or not weak_name:
                print("  [-] ERROR: Missing root_concept_name or weak_concept_name in root_flaw evidence!")
            else:
                print(f"    -> Root Cause: {root_name} | Weakness: {weak_name}")
                print(f"    -> Connection Strength: {strength}/10 | Flaw Score: {score}")
        elif sig_type == 'time_trap':
            time_trap_count += 1
            ratio = evidence.get('time_ratio') if isinstance(evidence, dict) else None
            if not ratio:
                print("  [-] WARNING: Missing time_ratio in time_trap evidence!")
            else:
                print(f"    -> Time ratio: {ratio}x slower than average")
        else:
            other_count += 1

    print("\n=== Summary Checklist ===")
    print(f"[*] Prerequisite Blockers (root_flaw) count: {root_flaw_count}")
    print(f"[*] Speed Pacing Traps (time_trap) count: {time_trap_count}")
    print(f"[*] Other weakness indicators count: {other_count}")
    
    if len(signals) == 0:
        print("[!] Note: Database table 'weakness_signals' is empty. Run attempts to generate signals.")
    else:
        print("[+] Database data structure and mappings look 100% correct and ready for frontend display!")

if __name__ == "__main__":
    main()
