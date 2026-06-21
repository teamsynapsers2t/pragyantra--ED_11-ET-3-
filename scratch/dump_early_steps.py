import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"
out_dir = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

target_steps = [21, 22, 23, 24]

print(f"Dumping early steps {target_steps}...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx in target_steps:
            try:
                step = json.loads(line)
                # Print details
                print(f"Step {idx}: type={step.get('type')}, status={step.get('status')}")
                tool_calls = step.get("tool_calls", [])
                if tool_calls:
                    print(f"  Tool Calls: {json.dumps(tool_calls, indent=2)}")
                
                # Write full content
                out_file = os.path.join(out_dir, f"early_step_{idx}.json")
                with open(out_file, 'w', encoding='utf-8') as out_f:
                    json.dump(step, out_f, indent=2)
                print(f"  Dumped step {idx} to {out_file}")
            except Exception as e:
                print(f"  Error: {e}")
