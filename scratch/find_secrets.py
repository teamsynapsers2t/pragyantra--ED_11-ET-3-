import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
print(f"Searching in {brain_dir}...")

keywords = ["SUPABASE_SERVICE_ROLE_KEY", "service_role_key", "postgres://", "postgresql://"]

if os.path.exists(brain_dir):
    for root, dirs, files in os.walk(brain_dir):
        for file in files:
            if file == "transcript.jsonl":
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        for idx, line in enumerate(f):
                            if any(kw in line for kw in keywords):
                                # Load JSON object to extract content
                                try:
                                    obj = json.loads(line)
                                    content = obj.get("content", "")
                                    tool_calls = obj.get("tool_calls", [])
                                    
                                    # Search in content
                                    for kw in keywords:
                                        if kw in content:
                                            # Find context
                                            kw_idx = content.find(kw)
                                            start = max(0, kw_idx - 100)
                                            end = min(len(content), kw_idx + 250)
                                            print(f"[{file} Line {idx}] Content Match for {kw}: ... {content[start:end]} ...")
                                            
                                    # Search in tool_calls
                                    if tool_calls:
                                        tc_str = json.dumps(tool_calls)
                                        if any(kw in tc_str for kw in keywords):
                                            print(f"[{file} Line {idx}] Tool Call Match: {tc_str[:300]}")
                                            
                                except Exception as je:
                                    pass
                except Exception as e:
                    print(f"Error reading {path}: {e}")
else:
    print("Brain directory does not exist.")
