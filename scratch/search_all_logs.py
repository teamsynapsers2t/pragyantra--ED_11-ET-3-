import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
print(f"Scanning all transcripts in {brain_dir}...")

keywords = ["fn_detect_root_flaws", "fn_apply_attempt", "create function", "create trigger"]

found = 0
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f):
                        # Simple keyword check first
                        if "fn_detect_root_flaws" in line or "fn_apply_attempt" in line:
                            try:
                                obj = json.loads(line)
                                content = obj.get("content", "")
                                tool_calls = obj.get("tool_calls", [])
                                
                                # Search content
                                if "CREATE FUNCTION" in content or "CREATE OR REPLACE FUNCTION" in content:
                                    print(f"\n=== Found SQL function definition in {path} Line {idx} ===")
                                    print(content)
                                    found += 1
                                    
                                # Search tool calls for SQL execution
                                if tool_calls:
                                    for tc in tool_calls:
                                        args = tc.get("arguments", tc.get("args", {}))
                                        if isinstance(args, dict):
                                            code = args.get("CodeContent", args.get("CommandLine", ""))
                                            if "CREATE FUNCTION" in code or "CREATE OR REPLACE FUNCTION" in code:
                                                print(f"\n=== Found SQL in Tool Call in {path} Line {idx} ===")
                                                print(code)
                                                found += 1
                            except Exception:
                                pass
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"Done. Found {found} matches.")
