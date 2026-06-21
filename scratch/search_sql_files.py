import os

workspace_dir = r"c:\Users\tumra\Documents\paper-AI"
print(f"Scanning workspace {workspace_dir} for SQL function creations (optimized)...")

matches = []
for root, dirs, files in os.walk(workspace_dir):
    # Skip large folders
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', 'temp_extract']]
    for file in files:
        if file.endswith((".sql", ".ts", ".js", ".json", ".txt")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f):
                        line_lower = line.lower()
                        if "create" in line_lower and "function" in line_lower and ("fn_detect_root_flaws" in line_lower or "detect_root_flaws" in line_lower):
                            matches.append((path, line_num, line))
            except Exception:
                pass

print(f"Found {len(matches)} matches:")
for path, line_num, line in matches:
    print(f"{path}:{line_num+1} -> {line.strip()[:120]}")
