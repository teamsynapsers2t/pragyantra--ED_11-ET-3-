import os

workspace_path = r"c:\Users\tumra\Documents\paper-AI"
print(f"Finding all SQL files in {workspace_path}...")

for root, dirs, files in os.walk(workspace_path):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
        
    for file in files:
        if file.endswith(".sql"):
            path = os.path.join(root, file)
            print(f"\n--- {path} ---")
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                    print("".join(lines[:15]))
            except Exception as e:
                print("Error reading:", e)
