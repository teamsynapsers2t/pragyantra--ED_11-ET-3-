import os
import urllib.parse
import base64
import json

def load_env():
    env = {}
    for filename in [".env", ".env.local"]:
        if os.path.exists(filename):
            with open(filename, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            env[parts[0].strip()] = parts[1].strip().strip('"').strip("'")
    return env

env = load_env()
db_url = env.get("DATABASE_URL")
print("DATABASE_URL:", db_url)

parsed = urllib.parse.urlparse(db_url)
params = urllib.parse.parse_qs(parsed.query)
api_key = params.get("api_key")

if api_key:
    val = api_key[0]
    print(f"api_key value length: {len(val)}")
    print(f"api_key value: {repr(val)}")
    
    # Try decoding
    for padding in ["", "=", "==", "==="]:
        try:
            candidate = val + padding
            decoded = base64.urlsafe_b64decode(candidate).decode('utf-8')
            print(f"Success with padding {repr(padding)}!")
            print(decoded[:100])
            break
        except Exception as e:
            print(f"Failed with padding {repr(padding)}: {e}")
            
    # Try direct split
    if "api_key=" in db_url:
        b64 = db_url.split("api_key=")[1].strip('"').strip("'")
        print(f"Direct split b64 length: {len(b64)}")
        print(f"Direct split b64: {repr(b64)}")
        for padding in ["", "=", "==", "==="]:
            try:
                candidate = b64 + padding
                decoded = base64.urlsafe_b64decode(candidate).decode('utf-8')
                print(f"Direct success with padding {repr(padding)}!")
                print(decoded[:100])
                break
            except Exception as e:
                print(f"Direct failed with padding {repr(padding)}: {e}")
