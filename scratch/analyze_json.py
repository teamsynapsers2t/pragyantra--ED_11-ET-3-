import json
import os

JSON_FILE_PATH = "jee_questions.json"

if not os.path.exists(JSON_FILE_PATH):
    print("File not found")
    exit(1)

subjects = {}
chapters = {}

print("Reading JSON file...")
with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
    questions = json.load(f)

print(f"Total questions in JSON: {len(questions)}")
if len(questions) > 0:
    print("Sample question keys:", list(questions[0].keys()))
    print("Sample question content:", questions[0])
    
    for q in questions:
        subj = q.get("subject", "Unknown")
        chap = q.get("chapter", "Unknown")
        
        subjects[subj] = subjects.get(subj, 0) + 1
        chapters[chap] = chapters.get(chap, 0) + 1

    print("\nSubjects count:")
    for s, c in subjects.items():
        print(f"  {s}: {c}")

    print("\nChapters count (first 15):")
    for ch, c in list(chapters.items())[:15]:
        print(f"  {ch}: {c}")
