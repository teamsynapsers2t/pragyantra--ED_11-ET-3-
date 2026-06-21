import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Searching transcript.jsonl for Page view steps...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            # Check if this step is a tool call or response related to page.tsx
            step_str = json.dumps(step)
            if "dashboard/page.tsx" in step_str:
                tool_calls = step.get("tool_calls", [])
                print(f"Step {idx}: type={step.get('type')}, status={step.get('status')}")
                if tool_calls:
                    for tc in tool_calls:
                        print(f"  Tool Call: {tc.get('name')}, args={tc.get('arguments')}")
                # Print response snippet if exists
                content = step.get("content", "")
                if content:
                    print(f"  Content length: {len(content)}")
                    if "export default function" in content or "DashboardPage" in content:
                        print("  Contains DashboardPage code!")
        except Exception as e:
            pass
