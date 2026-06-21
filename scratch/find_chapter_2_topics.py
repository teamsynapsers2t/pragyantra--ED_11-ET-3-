import json

with open("jee_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

topics = {}
for q in questions:
    sub = q.get("subject", "").lower()
    chap = q.get("chapter", "").lower()
    topic = q.get("topic")
    
    if "physics" in sub and "units" in chap:
        topics[topic] = topics.get(topic, 0) + 1

print("Topics found for Units & Dimensions:")
for topic, count in sorted(topics.items(), key=lambda x: x[1], reverse=True):
    print(f"  {topic}: {count} questions")
