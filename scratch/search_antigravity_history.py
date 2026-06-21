import os
import shutil

user_profile = os.environ.get("USERPROFILE", "C:\\Users\\tumra")
appdata_roaming = os.path.join(user_profile, "AppData", "Roaming")

search_paths = [
    os.path.join(appdata_roaming, "Antigravity", "User", "History"),
    os.path.join(appdata_roaming, "Antigravity IDE", "User", "History"),
]

keywords = [
    "expandedChapter",
    "activeSubject",
    "bg-[#0d1527]",
    "bg-[#090d16]",
    "activeChapter",
    "selectedDifficulty"
]

print("Scanning Antigravity history directories...")
found = []

for base_path in search_paths:
    if os.path.exists(base_path):
        print(f"Scanning: {base_path}")
        file_count = 0
        match_count = 0
        for root, dirs, files in os.walk(base_path):
            for file in files:
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
        print(f"Scanned {file_count} files. Found {match_count} matches.")
    else:
        print(f"Path does not exist: {base_path}")

if found:
    # Sort by mtime descending
    found.sort(key=lambda x: x[1], reverse=True)
    print("\n--- MOST RECENT MATCHES ---")
    for idx, (path, mtime, kws) in enumerate(found[:5]):
        print(f"{idx+1}. {path} (Modified: {mtime}, Keywords: {kws})")
        dest = os.path.join(r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch", f"recovered_history_{idx}.tsx")
        try:
            shutil.copy(path, dest)
            print(f"   Copied to {dest}")
        except Exception as e:
            print(f"   Failed to copy: {e}")
else:
    print("No matches found in Antigravity history folders.")
