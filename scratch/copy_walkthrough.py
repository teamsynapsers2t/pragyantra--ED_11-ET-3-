import os
import shutil

src = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\walkthrough.md"
dest = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\walkthrough_prev.md"

if os.path.exists(src):
    shutil.copy2(src, dest)
    print("Copied successfully.")
else:
    print("Source walkthrough.md does not exist.")
