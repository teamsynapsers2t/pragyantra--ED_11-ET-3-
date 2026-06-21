import os

walkthrough_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\walkthrough.md"

if os.path.exists(walkthrough_path):
    with open(walkthrough_path, 'r', encoding='utf-8') as f:
        print(f.read())
else:
    print("walkthrough.md does not exist.")
