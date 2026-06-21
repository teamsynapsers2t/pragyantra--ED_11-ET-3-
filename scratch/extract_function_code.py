import os
import json

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\found_function_code.txt"

print(f"Scanning all folders in {brain_dir}...")
found_blocks = []

for root, dirs, files in os.walk(brain_dir):
    # Skip current conversation
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                # To prevent excessive memory use, handle jsonl line-by-line
                if file.endswith(".jsonl"):
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        for idx, line in enumerate(f):
                            if "fn_detect_root_flaws" in line and ("CREATE FUNCTION" in line or "CREATE OR REPLACE FUNCTION" in line):
                                try:
                                    obj = json.loads(line)
                                    content = obj.get("content", "")
                                    if content and ("CREATE FUNCTION" in content or "CREATE OR REPLACE FUNCTION" in content):
                                        found_blocks.append(f"--- MATCH IN {path} LINE {idx} (Content) ---\n" + content + "\n")
                                    tool_calls = obj.get("tool_calls", [])
                                    for tc in tool_calls:
                                        tc_str = json.dumps(tc, indent=2)
                                        if "fn_detect_root_flaws" in tc_str and ("CREATE FUNCTION" in tc_str or "CREATE OR REPLACE FUNCTION" in tc_str):
                                            found_blocks.append(f"--- MATCH IN {path} LINE {idx} (Tool Call: {tc.get('name')}) ---\n" + tc_str + "\n")
                                except Exception:
                                    pass
                else:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "fn_detect_root_flaws" in content and ("CREATE FUNCTION" in content or "CREATE OR REPLACE FUNCTION" in content):
                            pos = content.find("fn_detect_root_flaws")
                            start = max(0, pos - 500)
                            end = min(len(content), pos + 3000)
                            found_blocks.append(f"--- MATCH IN {path} (Full File) ---\n" + content[start:end] + "\n")
            except Exception as e:
                pass

if found_blocks:
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Found {len(found_blocks)} occurrences of SQL definitions:\n\n")
        for b in found_blocks:
            out.write(b)
            out.write("="*80 + "\n\n")
    print(f"Successfully wrote matches to {output_path}")
else:
    print("No matches found.")
