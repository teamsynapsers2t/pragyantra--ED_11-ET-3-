with open("app/dashboard/page.tsx", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "rootFlaws" in line:
            print(f"Line {idx+1}: {line.strip()}")
