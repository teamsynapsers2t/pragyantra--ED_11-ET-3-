import os
import base64
import json
import urllib.parse
import psycopg2

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

def get_real_db_url():
    env = load_env()
    db_url = env.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not found in .env files")
    
    parsed = urllib.parse.urlparse(db_url)
    query_params = urllib.parse.parse_qs(parsed.query)
    
    api_key_list = query_params.get("api_key")
    if not api_key_list:
        # If no api_key, check if it's already a standard postgres URL
        if db_url.startswith("prisma+postgres://"):
            db_url = db_url.replace("prisma+postgres://", "postgres://")
        return db_url
        
    api_key = api_key_list[0]
    
    # Fix padding
    missing_padding = len(api_key) % 4
    if missing_padding:
        api_key += '=' * (4 - missing_padding)
        
    # Base64 decode api_key
    try:
        decoded_bytes = base64.b64decode(api_key)
    except Exception:
        api_key_clean = api_key.replace('_', '/').replace('-', '+')
        decoded_bytes = base64.b64decode(api_key_clean)
        
    decoded_str = decoded_bytes.decode("utf-8")
    data = json.loads(decoded_str)
    
    real_url = data.get("databaseUrl")
    if not real_url:
        raise ValueError("databaseUrl not found in decoded api_key")
        
    # Clean up Prisma-specific query params
    u = urllib.parse.urlparse(real_url)
    q = urllib.parse.parse_qs(u.query)
    allowed_params = ["sslmode", "sslcert", "sslkey", "sslrootcert", "host", "port", "dbname", "user", "password"]
    clean_q = {k: v for k, v in q.items() if k in allowed_params}
    clean_query_str = urllib.parse.urlencode(clean_q, doseq=True)
    
    # Rebuild URL
    real_url_cleaned = urllib.parse.urlunparse((
        u.scheme,
        u.netloc,
        u.path,
        u.params,
        clean_query_str,
        u.fragment
    ))
    return real_url_cleaned

def main():
    try:
        real_url = get_real_db_url()
        print(f"Decoded real database URL: {real_url.split('?')[0]}?...")
        
        # Connect to DB
        conn = psycopg2.connect(real_url)
        cur = conn.cursor()
        print("Connected to PostgreSQL successfully!")
        
        # Check tables
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
        tables = cur.fetchall()
        print("Tables:")
        for t in tables:
            print(f"  - {t[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
