import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for SQL creations...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        line_lower = line.lower()
        if "create" in line_lower and "trigger" in line_lower:
            print(f"Match on step {idx} (type: {json.loads(line).get('type')})")
            try:
                step = json.loads(line)
                content = step.get("content", "")
                if content:
                    print("--- Content Preview ---")
                    print(content[:1500])
                    print("-----------------------\n")
            except Exception as e:
                pass
