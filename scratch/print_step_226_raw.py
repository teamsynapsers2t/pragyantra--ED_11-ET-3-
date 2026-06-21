import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx == 226:
            step = json.loads(line)
            print("Step 226 (zero-indexed) details:")
            for k, v in step.items():
                if k != "thinking":
                    if k == "content" and len(str(v)) > 500:
                        print(f"  {k}: {str(v)[:500]}... [TRUNCATED]")
                    else:
                        print(f"  {k}: {v}")
