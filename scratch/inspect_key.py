with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/found_prisma_logs.txt", "r", errors="ignore") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "fn_apply_attempt" in line:
        print(f"Line {idx+1}:")
        start = max(0, idx - 10)
        end = min(len(lines), idx + 20)
        for i in range(start, end):
            print(f"  {i+1}: {lines[i].strip()}")
        print("-" * 50)
        # Limit to first 3 matches to avoid huge output
        if idx > 1000:
            break
