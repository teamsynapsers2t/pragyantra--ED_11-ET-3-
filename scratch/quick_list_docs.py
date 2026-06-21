import os

documents_path = r"c:\Users\tumra\Documents"
print(f"Quick listing page.tsx files in {documents_path}...")

for root, dirs, files in os.walk(documents_path):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    if '.next' in dirs:
        dirs.remove('.next')
        
    for file in files:
        if file.lower() == "page.tsx" or "dashboard" in file.lower():
            full_path = os.path.join(root, file)
            try:
                size = os.path.getsize(full_path)
                mtime = os.path.getmtime(full_path)
                print(f"Path: {full_path} | Size: {size} bytes | Modified: {mtime}")
            except:
                pass
print("Done!")
