import os

files = [".env", ".env.local", "paper-ai/.env", "paper-ai/.env.local"]
for path in files:
    if os.path.exists(path):
        print(f"=== {path} ===")
        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL") or "SUPABASE" in line or "PORT" in line:
                    print(line)
