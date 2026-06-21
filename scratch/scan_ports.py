import socket
import psycopg2

print("Scanning ports on 127.0.0.1...")
open_ports = []
for port in range(50000, 56000):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.01)
    result = s.connect_ex(('127.0.0.1', port))
    if result == 0:
        open_ports.append(port)
    s.close()

print(f"Open ports: {open_ports}")

for port in open_ports:
    try:
        print(f"Trying to connect to Postgres on port {port}...")
        conn = psycopg2.connect(
            host="127.0.0.1",
            database="template1",
            user="postgres",
            password="postgres",
            port=port,
            connect_timeout=2
        )
        print(f"SUCCESS! Connected on port {port}")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Version:", cur.fetchone())
        
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        print("Tables:", cur.fetchall())
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed on port {port}: {e}")
