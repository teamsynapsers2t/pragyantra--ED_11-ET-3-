with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/found_prisma_logs.txt", "r", errors="ignore") as f:
    for idx, line in enumerate(f):
        if "prisma" in line.lower() and "run_command" in line.lower():
            print(f"Line {idx+1}: {line.strip()[:200]}")
        elif "commandline" in line.lower() and "prisma" in line.lower():
            print(f"Line {idx+1}: {line.strip()[:200]}")
