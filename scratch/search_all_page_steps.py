import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for any reference to page.tsx...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "page.tsx" in step_str:
                content = step.get("content", "")
                tool_calls = step.get("tool_calls", [])
                
                # Check what type of step it is
                print(f"Step {idx}: type={step.get('type')}, status={step.get('status')}, content_len={len(content)}")
                if tool_calls:
                    for tc in tool_calls:
                        print(f"  Tool Call: {tc.get('name')}, args={tc.get('arguments')}")
                
                # If content exists, print if it is showing lines
                if "Showing lines" in content:
                    import re
                    match = re.search(r"Showing lines (\d+) to (\d+)", content)
                    if match:
                        print(f"  --> Views lines {match.group(1)} to {match.group(2)}")
        except Exception as e:
            pass
