import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            
            if step.get("type") == "VIEW_FILE":
                # Check what path was viewed
                tool_calls = []
                # Find the corresponding tool call in previous lines or inside the step
                # In jsonl, the step preceding VIEW_FILE is usually the model's tool_call
                print(f"Step {step.get('step_index')}: VIEW_FILE content preview:")
                first_lines = [l for l in content.split("\n")[:5] if l]
                for fl in first_lines:
                    print("  ", fl)
        except Exception as e:
            pass
