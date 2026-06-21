import socket
import psycopg2

host = "db.pdnpfpjtbpmuvzopvren.supabase.co"
port = 5432

print(f"Testing TCP connection to {host}:{port}...")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5.0)
result = s.connect_ex((host, port))
if result == 0:
    print("TCP connection to remote port 5432 succeeded!")
    s.close()
    
    passwords = [
        "T@nishq1234", "tanishq1234", "Tanishq@1234", "tanishq", "tanishq123", "Tanishq123",
        "postgres", "postgres123", "postgres1234", "Tanishq@123", "tanishq@123", "tanishq@1234"
    ]
    for pw in passwords:
        try:
            print(f"Trying password: {pw} ...")
            conn = psycopg2.connect(
                host=host,
                port=port,
                database="postgres",
                user="postgres",
                password=pw,
                connect_timeout=3
            )
            print("SUCCESS! Connected to remote database!")
            cur = conn.cursor()
            cur.execute("SELECT version();")
            print("Version:", cur.fetchone())
            cur.close()
            conn.close()
            break
        except Exception as e:
            print("Failed:", e)
else:
    print(f"TCP connection failed with code: {result}")
    s.close()
