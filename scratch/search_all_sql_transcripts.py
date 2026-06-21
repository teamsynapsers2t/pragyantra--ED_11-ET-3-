import os

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
print(f"Scanning all transcripts for 'fn_detect_root_flaws'...")

found = 0
for root, dirs, files in os.walk(brain_dir):
    # Ignore current conversation to keep output clean
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f):
                        if "fn_detect_root_flaws" in line or "fn_apply_attempt" in line:
                            # Let's see if this line contains PL/pgSQL statements like 'LANGUAGE plpgsql' or 'BEGIN' or 'CREATE'
                            line_lower = line.lower()
                            if "plpgsql" in line_lower or "declare" in line_lower or "returns void" in line_lower or "returns trigger" in line_lower:
                                print(f"\n=================== FOUND FUNCTION CODE IN {path} LINE {idx} ===================")
                                # Print a large window of the line
                                # Because it's JSONL, the entire step is on one line.
                                # Let's try to parse the JSON and pretty print the content/arguments so we can read it easily.
                                import json
                                try:
                                    step = json.loads(line)
                                    # Print step type and summary
                                    print(f"Type: {step.get('type')}, Status: {step.get('status')}")
                                    
                                    # Check content
                                    content = step.get("content", "")
                                    if content and ("fn_detect_root_flaws" in content or "fn_apply_attempt" in content):
                                        print("\n--- CONTENT ---")
                                        print(content)
                                        
                                    # Check tool calls
                                    tool_calls = step.get("tool_calls", [])
                                    if tool_calls:
                                        for tc in tool_calls:
                                            print(f"\n--- TOOL CALL: {tc.get('name')} ---")
                                            args = tc.get("arguments", tc.get("args", {}))
                                            if isinstance(args, dict):
                                                for k, v in args.items():
                                                    if isinstance(v, str) and ("fn_detect_root_flaws" in v or "fn_apply_attempt" in v):
                                                        print(f"{k}:")
                                                        print(v)
                                except Exception as je:
                                    print("Failed to parse JSON, printing raw substring around match:")
                                    pos = line.find("fn_detect_root_flaws")
                                    if pos == -1:
                                        pos = line.find("fn_apply_attempt")
                                    start = max(0, pos - 200)
                                    end = min(len(line), pos + 2000)
                                    print(line[start:end])
                                found += 1
                                if found > 20:
                                    print("Too many matches, stopping.")
                                    exit(0)
            except Exception as e:
                print(f"Error reading {path}: {e}")

print("Done.")
