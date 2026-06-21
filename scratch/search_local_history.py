import os
import glob

user_profile = os.environ.get("USERPROFILE", "C:\\Users\\tumra")
appdata_roaming = os.path.join(user_profile, "AppData", "Roaming")

search_paths = [
    os.path.join(appdata_roaming, "Antigravity", "User", "History"),
    os.path.join(appdata_roaming, "Antigravity IDE", "User", "History"),
    os.path.join(appdata_roaming, "Code", "User", "History"),
]

print("Searching Roaming AppData for history folders...")
found_files = []

for base_path in search_paths:
    if os.path.exists(base_path):
        print(f"Scanning history in: {base_path}")
        for root, dirs, files in os.walk(base_path):
            for file in files:
                full_path = os.path.join(root, file)
                try:
                    if os.path.getsize(full_path) > 10000: # >10KB
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read(2000) # Read first 2000 chars to check
                            if "export default function DashboardPage" in content:
                                mtime = os.path.getmtime(full_path)
                                print(f"FOUND MATCH: {full_path} (Size: {os.path.getsize(full_path)} bytes, Modified: {mtime})")
                                found_files.append((full_path, mtime))
                except Exception as e:
                    pass

if not found_files:
    print("No matches found.")
else:
    # Sort by modification time descending (most recent first)
    found_files.sort(key=lambda x: x[1], reverse=True)
    best_match = found_files[0][0]
    dest = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\recovered_dashboard.tsx"
    print(f"Copying most recent match from {best_match} to {dest}...")
    try:
        import shutil
        shutil.copy(best_match, dest)
        print("Success! File copied to scratch/recovered_dashboard.tsx")
    except Exception as e:
        print("Failed to copy file:", e)
