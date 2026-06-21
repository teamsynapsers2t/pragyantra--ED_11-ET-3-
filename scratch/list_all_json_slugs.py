import json

with open("jee_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

slugs_by_subject = {}
for q in questions:
    sub = q.get("subject")
    chap = q.get("chapter")
    if sub not in slugs_by_subject:
        slugs_by_subject[sub] = set()
    slugs_by_subject[sub].add(chap)

for sub, chaps in slugs_by_subject.items():
    print(f"\nSubject: {sub}")
    for chap in sorted(chaps):
        print(f"  {chap}")
