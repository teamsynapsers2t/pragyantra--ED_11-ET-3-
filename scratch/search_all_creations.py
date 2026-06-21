import re

with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/all_mentions_context.txt", "r", errors="ignore") as f:
    content = f.read()
    matches = re.finditer(r"create table\s+\w+", content, re.IGNORECASE)
    for m in matches:
        print(content[m.start():m.start()+200])
        print("-" * 50)
