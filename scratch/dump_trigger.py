import os
import psycopg2
import urllib.parse
import base64
import json

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
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

real_url = db_url
parsed = urllib.parse.urlparse(db_url)
if parsed.scheme == "prisma+postgres":
    qs = urllib.parse.parse_qs(parsed.query)
    api_key = qs.get("api_key", [None])[0]
    if api_key:
        api_key_clean = api_key.strip().replace('-', '+').replace('_', '/')
        # Find correct padding
        decoded_str = None
        for pad in [0, 1, 2, 3]:
            try:
                candidate = api_key_clean + '=' * pad
                decoded_bytes = base64.b64decode(candidate)
                decoded_str = decoded_bytes.decode('utf-8')
                break
            except Exception:
                continue
        if decoded_str:
            data = json.loads(decoded_str)
            real_url = data.get("databaseUrl")
            if "?" in real_url:
                real_url = real_url.split("?")[0]
            print("Extracted real URL:", real_url)
        else:
            print("Failed to decode api_key")
            exit(1)

try:
    conn = psycopg2.connect(real_url)
    cur = conn.cursor()
    print("Successfully connected to Postgres!")

    # Fetch fn_apply_attempt source code
    cur.execute("""
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'fn_apply_attempt';
    """)
    res = cur.fetchone()
    if res:
        print("\n=== fn_apply_attempt Definition ===")
        print(res[0])
    else:
        print("\nFunction fn_apply_attempt not found.")

    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
