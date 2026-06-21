import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for passwords/success/connection...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        # search for case-insensitive keywords
        line_lower = line.lower()
        if "success" in line_lower and ("password" in line_lower or "connect" in line_lower or "db" in line_lower or "postgres" in line_lower):
            print(f"Match on step {idx}!")
            try:
                step = json.loads(line)
                print(f"Type: {step.get('type')}")
                content = step.get("content", "")
                if content:
                    print(f"Content:\n{content[:1000]}\n")
            except Exception:
                pass
