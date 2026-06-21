import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\1ac34631-819c-4cdb-aff1-f7aec9a08d56\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            if step.get("type") == "USER_INPUT":
                content = step.get("content", "")
                if "PAPER" in content and "Micro-Weakness Engine" in content:
                    print(f"Match found in User Input Step {idx}. Writing to scratch/brief_raw.txt...")
                    with open("scratch/brief_raw.txt", "w", encoding="utf-8") as out:
                        out.write(content)
                    break
        except Exception as e:
            pass
