import os

next_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\.next"
print(f"Scanning Next.js build/dev cache at {next_path}...")

keyword = "activeSubject"
found_files = []

for root, dirs, files in os.walk(next_path):
    for file in files:
        if file.endswith(".js"):
            full_path = os.path.join(root, file)
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if keyword in content:
                    mtime = os.path.getmtime(full_path)
                    print(f"FOUND: {full_path} | Size: {os.path.getsize(full_path)} bytes | Modified: {mtime}")
                    found_files.append((full_path, mtime))
            except Exception as e:
                pass

if found_files:
    # Sort by modification time
    found_files.sort(key=lambda x: x[1])
    print("\n--- FOUND CHUNKS ---")
    for idx, (path, mtime) in enumerate(found_files):
         print(f"{idx+1}. {path} (Modified: {mtime})")
else:
    print("No chunks found in .next cache containing keyword.")
