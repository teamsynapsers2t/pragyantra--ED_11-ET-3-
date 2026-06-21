import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
print(f"Scanning all transcripts under {brain_dir}...")

matches = []
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f):
                        if "fn_detect_root_flaws" in line.lower():
                            matches.append((path, line_num, line))
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"Found {len(matches)} matches:")
for path, line_num, line in matches:
    print(f"\n--- {path} line {line_num} ---")
    try:
        data = json.loads(line)
        content = data.get("content", "")
        if content:
            print("CONTENT:")
            print(content[:2000])
        else:
            print("No content field, full line length:", len(line))
            print(line[:500])
    except Exception as e:
        print("Raw Line:")
        print(line[:500])
