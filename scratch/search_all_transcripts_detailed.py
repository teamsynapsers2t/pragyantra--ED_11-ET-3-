import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
print("Scanning all transcripts for fn_detect_root_flaws or fn_apply_attempt...")

found = 0
for root, dirs, files in os.walk(brain_dir):
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f):
                        if "fn_detect_root_flaws" in line or "fn_apply_attempt" in line:
                            # Let's parse JSON
                            try:
                                step = json.loads(line)
                                content = step.get("content", "")
                                tool_calls = step.get("tool_calls", [])
                                
                                # Search content
                                if content and ("function" in content.lower() or "trigger" in content.lower()):
                                    if "create" in content.lower():
                                        print(f"\n=================== FOUND IN {path} LINE {idx} (Content) ===================")
                                        # Find where create is and print around it
                                        pos = content.lower().find("fn_detect_root_flaws")
                                        if pos == -1:
                                            pos = content.lower().find("fn_apply_attempt")
                                        start = max(0, pos - 500)
                                        end = min(len(content), pos + 3000)
                                        print(content[start:end])
                                        found += 1
                                        
                                # Search tool calls
                                if tool_calls:
                                    for tc in tool_calls:
                                        tc_str = json.dumps(tc)
                                        if "create" in tc_str.lower() and ("function" in tc_str.lower() or "trigger" in tc_str.lower()):
                                            print(f"\n=================== FOUND IN {path} LINE {idx} (Tool Call: {tc.get('name')}) ===================")
                                            args = tc.get("arguments", tc.get("args", {}))
                                            if isinstance(args, dict):
                                                for k, v in args.items():
                                                    if isinstance(v, str) and ("fn_detect_root_flaws" in v or "fn_apply_attempt" in v):
                                                        print(f"{k}:")
                                                        # Print the whole value or a large chunk of it
                                                        print(v[:5000])
                                            found += 1
                            except Exception as e:
                                pass
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"Done. Found {found} matches.")
