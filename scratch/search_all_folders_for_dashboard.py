import os
import shutil

documents_path = r"c:\Users\tumra\Documents"
print(f"Scanning all folders in {documents_path} for dashboard backups...")

keywords = [
    "expandedChapter",
    "activeSubject",
    "bg-[#0d1527]",
    "bg-[#090d16]",
    "activeChapter",
    "selectedDifficulty"
]

found = []

# Sibling directories to search
sibling_dirs = [
    "Paper V1",
    "paper",
    "paperd",
    "via dashboard",
    "aspects",
    "Major project 1",
    "major projecct 2",
    "major project 3",
    "minor project",
    "duplicate"
]

for folder in sibling_dirs:
    folder_path = os.path.join(documents_path, folder)
    if os.path.exists(folder_path):
        print(f"Scanning folder: {folder_path}")
        file_count = 0
        match_count = 0
        for root, dirs, files in os.walk(folder_path):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
            if '.next' in dirs:
                dirs.remove('.next')
                
            for file in files:
                if file.endswith(".tsx") or file.endswith(".ts") or file.endswith(".js"):
                    file_count += 1
                    full_path = os.path.join(root, file)
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        matched_kws = [kw for kw in keywords if kw in content]
                        if matched_kws:
                            mtime = os.path.getmtime(full_path)
                            print(f"  FOUND: {full_path} | Size: {os.path.getsize(full_path)} bytes | Modified: {mtime} | Keywords: {matched_kws}")
                            found.append((full_path, mtime, matched_kws))
                            match_count += 1
                    except Exception as e:
                        pass
        print(f"Scanned {file_count} files in {folder}. Found {match_count} matches.")

if found:
    found.sort(key=lambda x: x[1], reverse=True)
    print("\n--- MOST RECENT MATCHES ---")
    for idx, (path, mtime, kws) in enumerate(found[:5]):
        print(f"{idx+1}. {path} (Modified: {mtime}, Keywords: {kws})")
        dest = os.path.join(r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch", f"recovered_sibling_{idx}.tsx")
        try:
            shutil.copy(path, dest)
            print(f"   Copied to {dest}")
        except Exception as e:
            print(f"   Failed to copy: {e}")
else:
    print("No matches found in any sibling folders.")
