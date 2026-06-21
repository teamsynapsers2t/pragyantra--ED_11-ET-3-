import psycopg2

passwords = [
    "Tanishq@1234", "Tanishq@123", "tanishq", "tanishq123", "Tanishq123", 
    "postgres", "postgres123", "postgres1234", "tanishq@123", "tanishq@1234",
    "T@nishq1234", "tanishq1234"
]

host = "aws-0-ap-south-1.pooler.supabase.com"
user = "postgres.pdnpfpjtbpmuvzopvren"
dbname = "postgres"

print("Trying connections to Supabase Pooler...")
connected = False
for pw in passwords:
    for port in [6543, 5432]:
        try:
            print(f"Trying port {port} with password: {pw[:4]}...")
            conn = psycopg2.connect(
                host=host,
                database=dbname,
                user=user,
                password=pw,
                port=port,
                connect_timeout=3
            )
            print(f"SUCCESS! Connected successfully on port {port} with password: {pw}")
            
            cur = conn.cursor()
            cur.execute("SELECT version();")
            print("Version:", cur.fetchone())
            cur.close()
            conn.close()
            connected = True
            break
        except Exception as e:
            print(f"Failed on port {port}: {str(e).strip()}")
    if connected:
        break

if not connected:
    print("Could not connect with any password to the pooler.")
