import re

with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/found_prisma_logs.txt", "r", errors="ignore") as f:
    content = f.read()
    
    # Search for occurrences of fn_apply_attempt function definition
    matches = re.finditer(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+fn_apply_attempt", content, re.IGNORECASE)
    for m in matches:
        print(f"Match at index {m.start()}:")
        print(content[m.start():m.start()+2500])
        print("=" * 80)
