import os

print("=== Reading .env ===")
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                # Print key and length of value
                parts = line.split("=", 1)
                if len(parts) == 2:
                    k, v = parts
                    print(f"  {k}: length {len(v)}, starts with {repr(v[:15])}")

print("\n=== Reading .env.local ===")
if os.path.exists(".env.local"):
    with open(".env.local", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    k, v = parts
                    print(f"  {k}: length {len(v)}, starts with {repr(v[:15])}")
