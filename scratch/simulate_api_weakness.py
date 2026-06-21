import os
import requests
import json

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
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
}

TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"

def simulate_mapping():
    # 1. Fetch weakness signals
    res_sig = requests.get(f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}", headers=headers)
    db_signals = res_sig.json()
    
    # 2. Fetch concepts map
    res_c = requests.get(f"{SUPABASE_URL}/rest/v1/concepts", headers=headers)
    concept_map = {c['id']: c['concept_name'] for c in res_c.json()}
    
    # 3. Fetch mastery records map
    res_m = requests.get(f"{SUPABASE_URL}/rest/v1/concept_mastery?user_id=eq.{TEST_USER_UUID}", headers=headers)
    mastery_map = {m['concept_id']: m for m in res_m.json()}
    
    mapped_signals = []
    for s in db_signals:
        if s['signal'] != 'root_flaw':
            # Keep weak_concept and time_trap as-is
            raw_concept_name = concept_map.get(s['concept_id'], "Unknown Concept")
            mapped_signals.append({
                "id": s['id'],
                "conceptId": s['concept_id'],
                "conceptName": raw_concept_name,
                "signal": s['signal'],
                "severity": s['severity'].lower(),
                "severityScore": s['severity_score'],
                "confidenceScore": s['confidence_score'],
                "evidence": s['evidence'],
                "insightMessage": "Standard insight",
                "createdAt": s['created_at'],
                "masteryScore": mastery_map.get(s['concept_id'], {}).get('mastery_score'),
                "totalAttempts": mastery_map.get(s['concept_id'], {}).get('total_attempts', 0),
                "totalCorrect": mastery_map.get(s['concept_id'], {}).get('total_correct', 0),
            })
            continue
            
        # For root_flaw, we map each child concept in the explains array
        parent_id = s['concept_id']
        parent_name = concept_map.get(parent_id, f"Concept #{parent_id}")
        parent_mastery_record = mastery_map.get(parent_id, {})
        parent_mastery = int(round(parent_mastery_record.get('mastery_score', 0.0) * 100))
        
        evidence_obj = s['evidence'] or {}
        explains = evidence_obj.get('explains', [])
        
        print(f"\nProcessing database root_flaw signal #{s['id']} (Parent Concept: {parent_name})")
        print(f"Explains children: {explains}")
        
        for idx, child in enumerate(explains):
            child_id = child.get('concept_id')
            strength = child.get('strength', 8)
            child_name = concept_map.get(child_id, f"Concept #{child_id}")
            
            child_mastery_record = mastery_map.get(child_id, {})
            child_mastery = int(round(child_mastery_record.get('mastery_score', 0.0) * 100))
            
            # Calculate root flaw score: (100 - parent_mastery) * strength
            root_flaw_score = (100 - parent_mastery) * strength
            
            # Construct mapped evidence
            mapped_evidence = {
                "root_concept_id": parent_id,
                "root_concept_name": parent_name,
                "weak_concept_id": child_id,
                "weak_concept_name": child_name,
                "root_mastery": parent_mastery,
                "weak_mastery": child_mastery,
                "relationship_strength": strength,
                "root_flaw_score": root_flaw_score
            }
            
            # Helper function to capitalize concept names
            def clean_label(label_str):
                return " ".join([word.capitalize() for word in label_str.replace('-', ' ').split()])
            
            clean_parent = clean_label(parent_name)
            clean_child = clean_label(child_name)
            
            insight_message = f"Your actual problem is {clean_parent}.\n\n{clean_child} is suffering because your foundation in {clean_parent} is weak."
            
            mapped_signals.append({
                "id": f"{s['id']}-{child_id}", # Unique mapped ID
                "conceptId": child_id,         # Store under child concept ID as expected by UI filters
                "conceptName": child_name,
                "signal": "root_flaw",
                "severity": s['severity'].lower(),
                "severityScore": s['severity_score'],
                "confidenceScore": s['confidence_score'],
                "evidence": mapped_evidence,
                "insightMessage": insight_message,
                "createdAt": s['created_at'],
                "masteryScore": child_mastery_record.get('mastery_score'),
                "totalAttempts": child_mastery_record.get('total_attempts', 0),
                "totalCorrect": child_mastery_record.get('total_correct', 0),
                "dominantErrorType": None
            })
            
    print("\nMAPPED SIGNALS TO RETURN TO FRONTEND:")
    print(json.dumps(mapped_signals, indent=2))

if __name__ == "__main__":
    simulate_mapping()
