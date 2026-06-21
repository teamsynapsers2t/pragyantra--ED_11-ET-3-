import os
import psycopg2

passwords = [
    "T@nishq1234", "tanishq1234", "Tanishq@1234", "tanishq", "tanishq123", "Tanishq123",
    "postgres", "postgres123", "postgres1234", "Tanishq@123", "tanishq@123", "tanishq@1234"
]
host = "db.pdnpfpjtbpmuvzopvren.supabase.co"
user = "postgres"
dbname = "postgres"
port = 5432

connected = False
for pw in passwords:
    try:
        print(f"Trying password: {pw} with SSL require...")
        conn = psycopg2.connect(
            host=host,
            database=dbname,
            user=user,
            password=pw,
            port=port,
            sslmode="require",
            connect_timeout=5
        )
        print("SUCCESS! Connected to PostgreSQL database with password:", pw)
        
        # Test query to check function signatures
        cur = conn.cursor()
        cur.execute("""
            SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname LIKE 'fn_%';
        """)
        print("Functions:")
        for row in cur.fetchall():
            print(f"  - {row[0]}({row[1]})")
            
        cur.close()
        conn.close()
        connected = True
        break
    except Exception as e:
        print("Failed:", str(e).strip())

if not connected:
    print("Could not connect with suspected passwords.")
