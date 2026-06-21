import os

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\all_mentions_context.txt"

print(f"Extracting contexts from {brain_dir}...")
contexts = []

for root, dirs, files in os.walk(brain_dir):
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                
                for idx, line in enumerate(lines):
                    if "fn_detect_root_flaws" in line:
                        start = max(0, idx - 50)
                        end = min(len(lines), idx + 50)
                        segment = "".join(lines[start:end])
                        contexts.append(f"--- MATCH IN {path} LINES {start}-{end} ---\n{segment}\n")
            except Exception:
                pass

if contexts:
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Found {len(contexts)} occurrences:\n\n")
        for c in contexts:
            out.write(c)
            out.write("="*80 + "\n\n")
    print("Wrote all mentions context to", output_path)
else:
    print("No matches.")
