import os
import re

brain_dir = r"C:\Users\tumra\.gemini\antigravity-ide"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\all_sql_definitions.txt"
current_conv = "b2f66a1a-60d9-4a9a-9042-f138effbec87"

print(f"Scanning all folders in {brain_dir}...")
definitions = {}

for root, dirs, files in os.walk(brain_dir):
    if current_conv in root:
        continue
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    # Check for CREATE FUNCTION or CREATE OR REPLACE FUNCTION block
                    # Let's search for fn_apply_attempt
                    if "fn_apply_attempt" in content and "CREATE" in content:
                        # Find occurrences
                        for match in re.finditer(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?fn_apply_attempt", content, re.IGNORECASE):
                            start_idx = match.start()
                            # Grab up to 5000 characters to get the whole function body
                            snippet = content[start_idx:start_idx+5000]
                            # Try to find the end of the function body ($$ LANGUAGE or similar)
                            end_match = re.search(r"\$\$\s*;?", snippet)
                            if end_match:
                                end_pos = end_match.end()
                                snippet = snippet[:end_pos]
                            definitions['fn_apply_attempt'] = snippet
                    
                    if "fn_generate_weakness_report" in content and "CREATE" in content:
                        for match in re.finditer(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?fn_generate_weakness_report", content, re.IGNORECASE):
                            start_idx = match.start()
                            snippet = content[start_idx:start_idx+5000]
                            end_match = re.search(r"\$\$\s*;?", snippet)
                            if end_match:
                                end_pos = end_match.end()
                                snippet = snippet[:end_pos]
                            definitions['fn_generate_weakness_report'] = snippet

                    if "attempts_after_insert" in content and "TRIGGER" in content:
                        for match in re.finditer(r"CREATE\s+TRIGGER\s+attempts_after_insert", content, re.IGNORECASE):
                            start_idx = match.start()
                            snippet = content[start_idx:start_idx+1000]
                            # Find semicolon or next command
                            end_pos = snippet.find(";")
                            if end_pos != -1:
                                snippet = snippet[:end_pos+1]
                            definitions['attempts_after_insert_trigger'] = snippet

            except Exception as e:
                pass

with open(output_path, "w", encoding="utf-8") as out:
    for name, code in definitions.items():
        out.write(f"=== {name} ===\n")
        out.write(code)
        out.write("\n\n" + "="*80 + "\n\n")

print(f"Successfully wrote definitions to {output_path}")
