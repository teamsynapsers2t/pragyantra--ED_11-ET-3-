import sys

lines = open(r'c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\found_prisma_logs.txt', encoding='utf-8').readlines()
start = 2050
end = 2200
for i in range(start, min(end, len(lines))):
    line = lines[i].strip()
    # Print safe ascii
    print(f"{i}: {line.encode('ascii', errors='ignore').decode('ascii')}")
