import base64
import json
import socket

def test_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=2):
            return True
    except Exception:
        return False

# Read root .env
with open("c:/Users/tumra/Documents/paper-AI/.env", "r") as f:
    for line in f:
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
            print("DATABASE_URL:", db_url)
            if "api_key=" in db_url:
                api_key = db_url.split("api_key=", 1)[1]
                missing_padding = len(api_key) % 4
                if missing_padding:
                    api_key += '=' * (4 - missing_padding)
                decoded = base64.b64decode(api_key.replace("_", "/").replace("-", "+")).decode("utf-8")
                print("Decoded config:", decoded)
                config = json.loads(decoded)
                db_url_inner = config.get("databaseUrl")
                print("databaseUrl inner:", db_url_inner)

for p in range(51200, 52000):
    if test_port("127.0.0.1", p):
        print(f"Port {p} is open!")
