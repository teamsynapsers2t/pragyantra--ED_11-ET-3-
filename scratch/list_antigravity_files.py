import os

base_path = r"C:\Users\tumra\.gemini\antigravity-ide"
print(f"Scanning {base_path} for page.tsx or dashboard...")

keyword = "activeSubject"
found_files = []

for root, dirs, files in os.walk(base_path):
    for file in files:
        full_path = os.path.join(root, file)
        try:
            if "page" in file or "dashboard" in file or file.endswith(".tsx") or file.endswith(".txt"):
                # Read content and search for keyword
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if keyword in content:
                    mtime = os.path.getmtime(full_path)
                    print(f"FOUND: {full_path} | Size: {os.path.getsize(full_path)} bytes | Modified: {mtime}")
                    found_files.append((full_path, mtime))
        except Exception as e:
            pass

if found_files:
    print(f"Total found: {len(found_files)}")
else:
    print("No files found containing keyword in antigravity-ide directory.")
