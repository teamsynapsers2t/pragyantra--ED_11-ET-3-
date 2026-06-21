import os
import json
import requests
import re
import sys

# Ensure stdout uses UTF-8 to prevent Windows terminal encoding errors
sys.stdout.reconfigure(encoding='utf-8')

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
    "Content-Type": "application/json"
}

def clean_text_for_match(text):
    if not text:
        return ""
    # Remove all whitespace and non-alphanumeric, lowercase
    return re.sub(r'[^a-zA-Z0-9]', '', text).lower()

def main():
    print("[*] Fetching all questions from Supabase...")
    # Fetch questions
    res_q = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=*", headers=headers)
    if res_q.status_code != 200:
        print("[-] Error fetching questions:", res_q.text)
        return
    db_questions = res_q.json()
    print(f"[+] Fetched {len(db_questions)} questions from DB.")

    print("[*] Fetching all concepts from Supabase...")
    # Fetch concepts
    res_c = requests.get(f"{SUPABASE_URL}/rest/v1/concepts?select=*", headers=headers)
    if res_c.status_code != 200:
        print("[-] Error fetching concepts:", res_c.text)
        return
    concepts = res_c.json()
    print(f"[+] Fetched {len(concepts)} concepts from DB.")

    # Group concepts by chapter_id
    concepts_by_chapter = {}
    for c in concepts:
        chap_id = c.get("chapter_id")
        if chap_id not in concepts_by_chapter:
            concepts_by_chapter[chap_id] = []
        concepts_by_chapter[chap_id].append(c)

    # Load local JSON questions
    print("[*] Loading local JSON questions...")
    with open("jee_questions.json", "r", encoding="utf-8") as f:
        local_questions = json.load(f)
    print(f"[+] Loaded {len(local_questions)} questions from local file.")

    # Index local questions by prefix
    local_lookup = {}
    for lq in local_questions:
        q_text = lq.get("question", "")
        clean = "".join(q_text.split()).lower()
        prefix = clean[:50]
        if prefix:
            if prefix not in local_lookup:
                local_lookup[prefix] = []
            local_lookup[prefix].append(lq)

    # Map database questions
    question_concepts_payload = []
    mapped_count = 0
    unmapped_count = 0
    mismatched_chapter_concepts = 0

    print("[*] Matching questions and concepts...")
    for idx, dbq in enumerate(db_questions):
        db_id = dbq.get("id")
        db_text = dbq.get("question_text", "")
        db_chapter_id = dbq.get("chapter_id")

        clean_db_text = "".join(db_text.split()).lower()
        prefix = clean_db_text[:50]
        
        matched_lq = None
        if prefix in local_lookup:
            matched_lq = local_lookup[prefix][0]
        else:
            # Fallback scan
            for k in local_lookup.keys():
                if k in clean_db_text or clean_db_text[:30] in k:
                    matched_lq = local_lookup[k][0]
                    break

        # Get the concepts in the database for the question's chapter
        chapter_concepts = concepts_by_chapter.get(db_chapter_id, [])

        if not chapter_concepts:
            print(f"[-] Warning: No concepts in DB for Chapter {db_chapter_id} of question {db_id}")
            unmapped_count += 1
            continue

        selected_concept_id = None

        if matched_lq:
            topic_slug = matched_lq.get("topic", "")
            if topic_slug:
                cleaned_topic = clean_text_for_match(topic_slug)
                # Try exact clean match
                for cc in chapter_concepts:
                    cleaned_cc_name = clean_text_for_match(cc.get("concept_name"))
                    if cleaned_cc_name == cleaned_topic or cleaned_cc_name in cleaned_topic or cleaned_topic in cleaned_cc_name:
                        selected_concept_id = cc.get("id")
                        break

                # Try token overlapping if no direct match
                if not selected_concept_id:
                    topic_words = set(w for w in re.split(r'[^a-zA-Z0-9]', topic_slug.lower()) if len(w) > 2)
                    best_match = None
                    max_overlap = 0
                    for cc in chapter_concepts:
                        cc_words = set(w for w in re.split(r'[^a-zA-Z0-9]', cc.get("concept_name", "").lower()) if len(w) > 2)
                        overlap = len(topic_words.intersection(cc_words))
                        if overlap > max_overlap:
                            max_overlap = overlap
                            best_match = cc

                    if best_match:
                        selected_concept_id = best_match.get("id")

        # Fallback to the first concept of the chapter if we couldn't match a specific one
        if not selected_concept_id:
            selected_concept_id = chapter_concepts[0].get("id")
            mismatched_chapter_concepts += 1

        question_concepts_payload.append({
            "question_id": db_id,
            "concept_id": selected_concept_id
        })
        mapped_count += 1

    print(f"[+] Total questions matched/mapped: {mapped_count}")
    print(f"[+] Total fallback/default mappings: {mismatched_chapter_concepts}")
    print(f"[+] Total unmappable (no concepts): {unmapped_count}")

    # Delete existing question_concepts mapping
    print("[*] Deleting existing question_concepts mappings...")
    del_res = requests.delete(f"{SUPABASE_URL}/rest/v1/question_concepts?id=not.is.null", headers=headers)
    print(f"[+] Delete status: {del_res.status_code}")

    # Insert mappings in batches
    BATCH_SIZE = 200
    success_insert = 0
    print("[*] Seeding question_concepts mappings...")
    for i in range(0, len(question_concepts_payload), BATCH_SIZE):
        batch = question_concepts_payload[i:i+BATCH_SIZE]
        ins_res = requests.post(f"{SUPABASE_URL}/rest/v1/question_concepts", headers=headers, json=batch)
        if ins_res.status_code in [200, 201]:
            success_insert += len(batch)
        else:
            print(f"[-] Error inserting batch {i // BATCH_SIZE}: {ins_res.text}")
            break

    print(f"[+] Successfully seeded {success_insert} mappings into question_concepts table.")

if __name__ == "__main__":
    main()
