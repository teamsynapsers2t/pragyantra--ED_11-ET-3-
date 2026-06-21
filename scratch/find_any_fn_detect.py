import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\found_fn_detect_mentions.txt"

print(f"Searching for 'fn_detect_root_flaws' in {brain_dir}...")
found_mentions = []

for root, dirs, files in os.walk(brain_dir):
    # Skip current conversation
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                if file.endswith(".jsonl"):
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        for idx, line in enumerate(f):
                            if "fn_detect_root_flaws" in line:
                                found_mentions.append(f"--- Mentions in {path} Line {idx} ---\n{line[:2000]}\n")
                else:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "fn_detect_root_flaws" in content:
                            pos = content.find("fn_detect_root_flaws")
                            start = max(0, pos - 1000)
                            end = min(len(content), pos + 2000)
                            found_mentions.append(f"--- Mentions in {path} ---\n...{content[start:end]}...\n")
            except Exception as e:
                pass

if found_mentions:
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Found {len(found_mentions)} mentions of fn_detect_root_flaws:\n\n")
        for m in found_mentions:
            out.write(m)
            out.write("="*80 + "\n\n")
    print(f"Successfully wrote mentions to {output_path}")
else:
    print("No mentions found.")
