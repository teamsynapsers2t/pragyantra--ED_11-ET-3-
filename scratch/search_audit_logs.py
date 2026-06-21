import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\40d4e476-ee4a-4110-9431-8d8a9b470255\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for 'Step 3 diagnostic'...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "Step 3 diagnostic" in step_str:
                print(f"\nStep {idx} ({step.get('type')}):")
                # Print occurrences of Step 3 logs
                for l in step_str.split("\\n"):
                    if "Step 3" in l:
                        print("  ", l)
        except Exception as e:
            pass
