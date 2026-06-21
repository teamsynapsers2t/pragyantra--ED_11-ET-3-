import os
import re

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide\brain"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\smart_extracted_code.txt"

print(f"Scanning for fn_detect_root_flaws code blocks in {brain_dir}...")
extracted = []

# Regex to match SQL function definitions
# Look for CREATE OR REPLACE FUNCTION or similar, or just SQL code blocks
sql_block_re = re.compile(r"(\bcreate\s+(?:or\s+replace\s+)?function\s+fn_detect_root_flaws.*?\blanguage\s+plpgsql\b.*?)(?=\bcreate\b|\Z)", re.IGNORECASE | re.DOTALL)

for root, dirs, files in os.walk(brain_dir):
    if "db558945-cbf9-49c9-b96b-2592ab2e3df7" in root:
        continue
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Check for the function name
                if "fn_detect_root_flaws" in content:
                    # Let's search for any CREATE FUNCTION or ALTER FUNCTION or SQL block
                    # Let's extract any blocks of SQL
                    pos = 0
                    while True:
                        pos = content.find("fn_detect_root_flaws", pos)
                        if pos == -1:
                            break
                        
                        # Get a window of 3000 characters around the hit
                        start = max(0, pos - 1000)
                        end = min(len(content), pos + 3000)
                        window = content[start:end]
                        
                        # See if this window contains function definition keywords
                        if "language" in window.lower() and "begin" in window.lower():
                            extracted.append(f"--- Code block in {path} ---\n{window}\n")
                            break # only one per file to avoid spam
                        
                        pos += len("fn_detect_root_flaws")
            except Exception:
                pass

if extracted:
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"Found {len(extracted)} potential function definitions:\n\n")
        for ext in extracted:
            out.write(ext)
            out.write("="*80 + "\n\n")
    print(f"Successfully wrote extracted code blocks to {output_path}")
else:
    print("No code blocks found.")
