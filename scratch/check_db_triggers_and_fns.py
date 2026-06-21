import os
import urllib.parse
import base64
import json
import psycopg2

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
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

parsed = urllib.parse.urlparse(db_url)
params = urllib.parse.parse_qs(parsed.query)
api_key = params.get("api_key")
if api_key:
    api_key_str = api_key[0]
    api_key_str += '=' * (-len(api_key_str) % 4)
    decoded = base64.urlsafe_b64decode(api_key_str).decode('utf-8')
    data = json.loads(decoded)
    real_db_url = data.get("databaseUrl")
    print("Decoded DB URL:", real_db_url)
else:
    real_db_url = db_url

def clean_postgres_url(url):
    if not url:
        return None
    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query)
    clean_qs = {}
    if 'sslmode' in qs:
        clean_qs['sslmode'] = qs['sslmode'][0]
    else:
        clean_qs['sslmode'] = 'disable'
    new_query = urllib.parse.urlencode(clean_qs)
    new_parts = list(parsed)
    new_parts[4] = new_query
    return urllib.parse.urlunparse(new_parts)

urls_to_try = [
    clean_postgres_url(real_db_url),
    clean_postgres_url(real_db_url.replace(":51214/", ":51603/")) if real_db_url else None
]

conn = None
for url in urls_to_try:
    if not url:
        continue
    try:
        print(f"Trying to connect to: {url}")
        conn = psycopg2.connect(url)
        print("Connected successfully!")
        break
    except Exception as e:
        print(f"Failed to connect to {url}: {e}")

if not conn:
    print("Could not connect to any database URL")
    exit(1)

try:
    cur = conn.cursor()
    
    # 1. Query all triggers
    print("\n=== TRIGGERS IN DB ===")
    cur.execute("""
        SELECT tgname, tgrelid::regclass, tgfoid::regprocedure, tgtype
        FROM pg_trigger
        WHERE tgisinternal = false;
    """)
    triggers = cur.fetchall()
    for t in triggers:
        print(f"Trigger Name: {t[0]}, Table: {t[1]}, Function: {t[2]}, Type: {t[3]}")

    # 2. Query function definitions
    print("\n=== FUNCTIONS DEFINITIONS ===")
    cur.execute("""
        SELECT p.proname, pg_get_functiondef(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN ('fn_apply_attempt', 'fn_detect_root_flaws', 'fn_generate_weakness_report', 'fn_update_concept_mastery');
    """)
    funcs = cur.fetchall()
    for f in funcs:
        print(f"\n=========================================\nFunction {f[0]}:\n=========================================")
        print(f[1])

    cur.close()
    conn.close()
except Exception as e:
    print("Error during query:", e)
