import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Listing details of steps that contain 'DashboardPage' or 'page.tsx':")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            step_str = json.dumps(step)
            if "page.tsx" in step_str or "DashboardPage" in step_str:
                content = step.get("content", "")
                if not content:
                    # Let's check tool_calls and responses
                    continue
                
                print(f"--- STEP {idx} (type={step.get('type')}, size={len(content)}) ---")
                # Print first 2 lines and last 2 lines
                lines = content.split('\n')
                if len(lines) > 4:
                    print("Start:")
                    for l in lines[:5]:
                        print("  ", l[:120])
                    print("End:")
                    for l in lines[-5:]:
                        print("  ", l[:120])
                else:
                    print(content[:300])
        except Exception as e:
            pass
