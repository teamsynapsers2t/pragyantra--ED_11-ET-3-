import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx == 226:
            try:
                step = json.loads(line)
                print("Step 226 type:", step.get("type"))
                tool_calls = step.get("tool_calls", [])
                if tool_calls:
                    for tc in tool_calls:
                        print("  Tool Call:", tc.get("name"))
                        args = tc.get("arguments", {})
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except:
                                pass
                        print("  Arguments keys:", args.keys() if hasattr(args, 'keys') else type(args))
                        # Dump to file
                        with open(r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\step_226_write.json", 'w', encoding='utf-8') as out_f:
                            json.dump(args, out_f, indent=2)
                        print("  Saved arguments to scratch/step_226_write.json")
            except Exception as e:
                print("Error:", e)
