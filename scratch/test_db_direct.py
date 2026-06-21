import os
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

env = load_env()
db_url = env.get("DATABASE_URL").replace("prisma+postgres://", "postgres://")

if not db_url:
    print("DATABASE_URL not found in .env.local")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("Successfully connected to Postgres!")
    
    # Check tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    """)
    tables = cur.fetchall()
    print("\nTables in public schema:")
    for t in tables:
        print(f"  - {t[0]}")
        
    # Check triggers on attempts table
    cur.execute("""
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'attempts';
    """)
    triggers = cur.fetchall()
    print("\nTriggers on 'attempts' table:")
    for tr in triggers:
         print(f"  - Name: {tr[0]}, Event: {tr[1]}, Action: {tr[2]}")
         
    # Check if fn_apply_attempt exists
    cur.execute("""
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_name LIKE 'fn_apply%';
    """)
    routines = cur.fetchall()
    print("\nFunctions matching 'fn_apply%':")
    for r in routines:
         print(f"  - Name: {r[0]}, Type: {r[1]}")
         
    cur.close()
    conn.close()
except Exception as e:
    print("Database Connection Error:", e)
