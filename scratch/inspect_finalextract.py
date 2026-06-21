import os

target = r"c:\Users\tumra\Documents\finalextract\frontend\src\app\page.tsx"
if os.path.exists(target):
    print(f"File exists! Size: {os.path.getsize(target)} bytes")
    with open(target, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("Checking keywords in content...")
    keywords = ["activeSubject", "expandedChapter", "bg-[#0d1527]", "bg-[#090d16]", "bg-orange-50"]
    for kw in keywords:
        print(f"  Keyword '{kw}' in file: {kw in content}")
    
    print("\nFirst 40 lines:")
    lines = content.splitlines()
    for l in lines[:40]:
        # Encode with ascii ignore to avoid Windows terminal print errors
        print("  ", l.encode('ascii', errors='ignore').decode('ascii'))
else:
    print("File does not exist.")
