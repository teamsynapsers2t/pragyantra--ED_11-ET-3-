import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\all_page_steps.txt"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Writing all steps referencing page.tsx to file...")
with open(log_path, 'r', encoding='utf-8') as f, open(out_path, 'w', encoding='utf-8') as out_f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "page.tsx" in step_str:
                content = step.get("content", "")
                tool_calls = step.get("tool_calls", [])
                
                out_f.write(f"Step {idx}: type={step.get('type')}, status={step.get('status')}, content_len={len(content)}\n")
                if tool_calls:
                    for tc in tool_calls:
                        out_f.write(f"  Tool Call: {tc.get('name')}, args={json.dumps(tc.get('arguments'))}\n")
                
                if "Showing lines" in content:
                    import re
                    match = re.search(r"Showing lines (\d+) to (\d+)", content)
                    if match:
                        out_f.write(f"  --> Views lines {match.group(1)} to {match.group(2)}\n")
                out_f.write("\n")
        except Exception as e:
            pass

print("Complete! Output written to scratch/all_page_steps.txt")
