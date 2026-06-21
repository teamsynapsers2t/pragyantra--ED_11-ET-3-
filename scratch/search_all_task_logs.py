import os

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\found_log_definitions.txt"

print(f"Scanning task logs in {brain_dir}...")
found_blocks = []

for root, dirs, files in os.walk(brain_dir):
    # Skip current conversation
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith(".log"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "fn_detect_root_flaws" in content or "fn_apply_attempt" in content:
                        print(f"Found match in {path}")
                        pos = content.find("fn_detect_root_flaws")
                        if pos == -1:
                            pos = content.find("fn_apply_attempt")
                        start = max(0, pos - 100)
                        end = min(len(content), pos + 3000)
                        found_blocks.append(f"--- MATCH IN {path} ---\n{content[start:end]}\n")
            except Exception as e:
                pass

if found_blocks:
    with open(output_path, "w", encoding="utf-8") as out:
        for b in found_blocks:
            out.write(b)
            out.write("="*80 + "\n\n")
    print(f"Successfully wrote matches to {output_path}")
else:
    print("No matches found.")
