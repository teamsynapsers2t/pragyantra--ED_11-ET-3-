import os
import psycopg2

passwords = ["T@nishq1234", "tanishq1234"]
host = "db.pdnpfpjtbpmuvzopvren.supabase.co"
user = "postgres"
dbname = "postgres"
port = 5432

connected = False
for pw in passwords:
    try:
        print(f"Trying password: {pw}")
        conn = psycopg2.connect(
            host=host,
            database=dbname,
            user=user,
            password=pw,
            port=port,
            connect_timeout=5
        )
        print("SUCCESS! Connected to PostgreSQL database!")
        
        # Test query
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Version:", cur.fetchone())
        
        cur.close()
        conn.close()
        connected = True
        break
    except Exception as e:
        print("Failed:", e)

if not connected:
    print("Could not connect with suspected passwords.")
