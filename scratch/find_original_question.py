import json
import re

with open("jee_questions.json", "r", encoding="utf-8") as f:
    local_questions = json.load(f)

print("Total local questions:", len(local_questions))

# Let's search for a few questions by text substrings
targets = [
    ("142", "moving along the x-axis with initial velocity u i. It collides elastically"),
    ("1256", "particle moving with kinetic energy E has de Broglie"),
    ("317", "minimum possible work is done by a refrigerator"),
    ("490", "distance between an object and a screen is 100 cm"),
    ("1080", "Proton with kinetic energy of")
]

for tag, substring in targets:
    print(f"\nSearching for target {tag}: '{substring}'")
    found_any = False
    for lq in local_questions:
        q_text = lq.get("question", "")
        if substring.lower() in q_text.lower() or "".join(substring.split()).lower() in "".join(q_text.split()).lower():
            print("Found match:")
            print(f"  Subject: {lq.get('subject')}")
            print(f"  Chapter: {lq.get('chapter')}")
            print(f"  Topic: {lq.get('topic')}")
            print(f"  Year: {lq.get('year')}")
            print(f"  Question excerpt: {q_text[:120]}...")
            found_any = True
    if not found_any:
        print("  No match found in local JSON!")
