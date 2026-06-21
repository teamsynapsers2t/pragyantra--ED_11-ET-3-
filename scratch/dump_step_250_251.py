import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"
out_dir = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

target_steps = [250, 251]

print(f"Dumping steps {target_steps}...")
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx in target_steps:
            try:
                step = json.loads(line)
                out_file = os.path.join(out_dir, f"step_{idx}_raw.json")
                with open(out_file, 'w', encoding='utf-8') as out_f:
                    json.dump(step, out_f, indent=2)
                print(f"Dumped step {idx} to {out_file} (size: {len(json.dumps(step))} bytes)")
            except Exception as e:
                print(f"Error dumping step {idx}: {e}")
