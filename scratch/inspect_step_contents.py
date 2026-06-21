import os
import re

dir_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch"

for filename in os.listdir(dir_path):
    if filename.startswith("step_") and filename.endswith("_content.txt"):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            header = f.read(1000)
            print(f"=== {filename} ===")
            # Look for lines like "Showing lines X to Y" or "File Path:"
            lines_match = re.search(r"Showing lines (\d+) to (\d+)", header)
            if lines_match:
                print(f"  Range: {lines_match.group(0)}")
            else:
                print("  No line range found in first 1000 chars")
            
            # Print first few lines of actual code (lines starting with digit followed by colon)
            code_lines = []
            f.seek(0)
            for line in f:
                match = re.match(r"^\s*(\d+):\s(.*)", line)
                if match:
                    code_lines.append(match.group(1))
            if code_lines:
                print(f"  Code line numbers found: {code_lines[0]} to {code_lines[-1]} (Total {len(code_lines)} lines)")
            else:
                print("  No numbered code lines found")
