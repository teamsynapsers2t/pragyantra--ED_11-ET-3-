import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for 'password'...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if "password" in line.lower():
            try:
                step = json.loads(line)
                print(f"Match on step {idx} (type: {step.get('type')})")
                content = step.get("content", "")
                if content:
                    # Print lines containing password
                    for l in content.split("\n"):
                        if "password" in l.lower():
                            print("  ", l.strip()[:150])
            except Exception as e:
                pass
