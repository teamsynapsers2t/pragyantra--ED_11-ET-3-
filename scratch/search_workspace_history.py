import re

with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/found_fn_detect_mentions.txt", "r", errors="ignore") as f:
    content = f.read()

# Search for CREATE FUNCTION or SELECT pg_get_functiondef or similar definitions
matches = re.finditer(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(?:fn_apply_attempt|fn_generate_weakness_report)", content, re.IGNORECASE)
found = False
for m in matches:
    found = True
    print(f"Match at index {m.start()}:")
    print(content[m.start():m.start()+1500])
    print("=" * 80)

if not found:
    # Just look for the words case-insensitively and print lines containing them
    print("No CREATE FUNCTION found. Searching for mentions...")
    lines = content.split('\n')
    for idx, line in enumerate(lines):
        if "fn_apply_attempt" in line or "fn_generate_weakness_report" in line:
            if "function" in line.lower() or "trigger" in line.lower():
                print(f"Line {idx+1}: {line.strip()[:200]}")
