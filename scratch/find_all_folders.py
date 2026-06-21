import os

user_profile = os.environ.get("USERPROFILE", "C:\\Users\\tumra")
appdata = os.path.join(user_profile, "AppData")

print("Searching AppData for folders containing 'history'...")
for root, dirs, files in os.walk(appdata):
    # Avoid scanning too deep into large node_modules or cache folders if possible,
    # but we want to scan app profiles. Let's prune some known large folders to stay fast.
    for d in list(dirs):
        low_d = d.lower()
        if "cache" in low_d or "temp" in low_d or "microsoft" in low_d or "npm" in low_d or "yarn" in low_d or "pip" in low_d or "chrome" in low_d:
            dirs.remove(d)
        elif "history" in low_d:
            full_path = os.path.join(root, d)
            print(f"FOUND HISTORY DIR: {full_path}")
