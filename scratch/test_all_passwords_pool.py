import os
import psycopg2

passwords = [
    "tanishq", "tanishq123", "Tanishq123", "Tanishq1234", 
    "postgres", "postgres123", "postgres1234",
    "Tanishq@123", "tanishq@123", "Tanishq@1234", "tanishq@1234",
    "T@nishq1234", "tanishq1234"
]
host = "db.pdnpfpjtbpmuvzopvren.supabase.co"
user = "postgres"
dbname = "postgres"
port = 6543

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
            connect_timeout=3
        )
        print(f"SUCCESS! Password is: {pw}")
        conn.close()
        connected = True
        break
    except Exception as e:
        print("Failed:", str(e).strip())

if not connected:
    print("Could not connect with any password.")
