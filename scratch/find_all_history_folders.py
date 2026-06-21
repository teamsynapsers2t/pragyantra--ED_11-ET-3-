import os

user_profile = os.environ.get("USERPROFILE", "C:\\Users\\tumra")
appdata_roaming = os.path.join(user_profile, "AppData", "Roaming")
appdata_local = os.path.join(user_profile, "AppData", "Local")

print("Listing Roaming directories:")
try:
    for item in os.listdir(appdata_roaming):
        if "antigravity" in item.lower() or "code" in item.lower() or "gemini" in item.lower():
            print("  ", item)
            # check if there is a User/History inside
            hist_path = os.path.join(appdata_roaming, item, "User", "History")
            if os.path.exists(hist_path):
                print(f"    FOUND History in {item}: {hist_path}")
except Exception as e:
    print("Error listing Roaming:", e)

print("\nListing Local directories:")
try:
    for item in os.listdir(appdata_local):
        if "antigravity" in item.lower() or "code" in item.lower() or "gemini" in item.lower():
            print("  ", item)
            hist_path = os.path.join(appdata_local, item, "User", "History")
            if os.path.exists(hist_path):
                print(f"    FOUND History in {item}: {hist_path}")
except Exception as e:
    print("Error listing Local:", e)
