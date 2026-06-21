import os

target = r"c:\Users\tumra\Documents\New folder\pragyantra--ED_11-ET-3-\paper-ai\app\dashboard\page.tsx"
if os.path.exists(target):
    print(f"File exists! Size: {os.path.getsize(target)} bytes")
    with open(target, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Checking keywords in content...")
    keywords = ["activeSubject", "expandedChapter", "bg-[#0d1527]", "bg-[#090d16]", "bg-orange-50"]
    for kw in keywords:
        print(f"  Keyword '{kw}' in file: {kw in content}")
    
    print("\nFirst 40 lines:")
    lines = content.splitlines()
    for l in lines[:40]:
        print("  ", l)
else:
    print("File does not exist.")
