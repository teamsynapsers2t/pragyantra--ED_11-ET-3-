import os

def load_env():
    env = {}
    for path in [".env", ".env.local"]:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip()
                            env[key] = val
    return env

env = load_env()
db_url = env.get("DATABASE_URL")
print("DATABASE_URL Raw:", db_url)
if db_url and "api_key=" in db_url:
    prefix, b64 = db_url.split("api_key=", 1)
    print("b64 suffix raw:", b64)
    print("b64 suffix length:", len(b64))
    print("b64 ends with:", repr(b64[-5:]))
