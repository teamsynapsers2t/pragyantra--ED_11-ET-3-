import os

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide"
print(f"Scanning all files in {brain_dir}...")

found = 0
for root, dirs, files in os.walk(brain_dir):
    # Skip current conversation to avoid matching our query
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith((".log", ".jsonl")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f):
                        if "fn_detect_root_flaws" in line or "fn_apply_attempt" in line:
                            # Check if the line has SQL function body indicators
                            line_lower = line.lower()
                            if "language plpgsql" in line_lower or "returns trigger" in line_lower or "returns void" in line_lower or "declare" in line_lower:
                                print(f"\nMatch in {path} Line {idx+1}:")
                                # Print around the match
                                pos = line_lower.find("fn_detect_root_flaws")
                                if pos == -1:
                                    pos = line_lower.find("fn_apply_attempt")
                                start = max(0, pos - 200)
                                end = min(len(line), pos + 2500)
                                print(line[start:end])
                                found += 1
                                if found > 20:
                                    print("Too many matches, stopping.")
                                    exit(0)
            except Exception as e:
                pass

print(f"Done. Found {found} matches.")
