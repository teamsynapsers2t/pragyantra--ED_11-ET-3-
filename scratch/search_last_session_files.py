import os

folder_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\d03f2616-c637-4e86-a7d8-81edbc763106"
print(f"Scanning files in {folder_path}...")

for root, dirs, files in os.walk(folder_path):
    for file in files:
        if file.endswith((".log", ".md", ".txt", ".json", ".jsonl")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "fn_detect_root_flaws" in content and ("CREATE FUNCTION" in content or "CREATE OR REPLACE FUNCTION" in content):
                        print(f"\n=================== FOUND IN {path} ===================")
                        # Print where CREATE FUNCTION fn_detect_root_flaws is
                        pos = content.find("fn_detect_root_flaws")
                        start = max(0, pos - 500)
                        end = min(len(content), pos + 3000)
                        print(content[start:end])
            except Exception as e:
                print(f"Error reading {path}: {e}")

print("Done.")
