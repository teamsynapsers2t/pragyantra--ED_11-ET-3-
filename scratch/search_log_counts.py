import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\40d4e476-ee4a-4110-9431-8d8a9b470255\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "Concept 107" in step_str:
                print(f"Step {idx}:")
                for l in step_str.split("\\n"):
                    if "Concept 107" in l or "questions" in l:
                        print("  ", l)
        except Exception as e:
            pass
