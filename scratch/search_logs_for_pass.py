import os
import sys

path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\found_prisma_logs.txt"
output_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\search_results.txt"

if os.path.exists(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    out_lines = []
    out_lines.append(f"Total length: {len(content)}\n")
    keywords = ["connected", "T@nishq", "password", "success", "db.pdnp"]
    for kw in keywords:
        pos = 0
        count = 0
        while True:
            pos = content.lower().find(kw.lower(), pos)
            if pos == -1:
                break
            count += 1
            start = max(0, pos - 100)
            end = min(len(content), pos + 150)
            out_lines.append(f"Keyword '{kw}' match {count}:\n")
            out_lines.append(repr(content[start:end]) + "\n")
            out_lines.append("-" * 50 + "\n")
            pos += len(kw)
            
    with open(output_path, "w", encoding="utf-8") as out:
        out.writelines(out_lines)
    print("Successfully wrote search results to", output_path)
else:
    print("found_prisma_logs.txt not found")
