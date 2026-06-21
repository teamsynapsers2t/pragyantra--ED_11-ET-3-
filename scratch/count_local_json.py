import json
import os

JSON_FILE_PATH = "jee_questions.json"

if os.path.exists(JSON_FILE_PATH):
    print("Reading file...")
    with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    print("Total items in JSON:", len(data))
    
    subjects = {}
    for item in data:
        sub = item.get("subject", "None")
        subjects[sub] = subjects.get(sub, 0) + 1
    print("Subjects count in JSON:")
    for sub, count in subjects.items():
        print(f"  {sub}: {count}")
else:
    print("JSON file not found.")
