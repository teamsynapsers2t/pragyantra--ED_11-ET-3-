import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

print("Reading steps from transcript.jsonl...")
steps = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            steps.append(json.loads(line))
        except Exception:
            pass

print(f"Total steps: {len(steps)}")
print("\n--- Last 15 steps ---")
for idx in range(max(0, len(steps)-15), len(steps)):
    step = steps[idx]
    print(f"\nStep {idx}: type={step.get('type')}, source={step.get('source')}, status={step.get('status')}")
    content = step.get("content", "")
    if content:
        print(f"  Content summary: {content[:200]}...")
    tool_calls = step.get("tool_calls", [])
    if tool_calls:
        print("  Tool Calls:")
        for tc in tool_calls:
            print(f"    Name: {tc.get('name')}, arguments: {tc.get('arguments')}")
