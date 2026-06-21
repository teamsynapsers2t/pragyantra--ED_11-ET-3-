import os
import base64
import json
import urllib.parse

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
                            val = parts[1].strip().strip('"').strip("'")
                            env[key] = val
    return env

env = load_env()
db_url = env.get("DATABASE_URL")
if not db_url or "api_key=" not in db_url:
    print("No DATABASE_URL or api_key in .env")
    exit(1)

prefix, api_key_b64 = db_url.split("api_key=", 1)
api_key_b64 = api_key_b64.strip().strip('"').strip("'")

# Decode base64
b64_str = api_key_b64.replace("_", "/").replace("-", "+")
missing_padding = len(b64_str) % 4
if missing_padding:
    b64_str += '=' * (4 - missing_padding)

decoded_bytes = base64.b64decode(b64_str)
decoded_str = decoded_bytes.decode('utf-8')
config = json.loads(decoded_str)
print("Decoded config:")
print(json.dumps(config, indent=2))
print("Proxy URL prefix:", prefix)
