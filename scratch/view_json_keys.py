import json

with open("jee_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("First item in JSON:")
print(json.dumps(data[0], indent=2))
