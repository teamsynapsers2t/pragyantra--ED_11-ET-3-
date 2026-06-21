import socket
import psycopg2

print("Scanning ports from 50000 to 65000 on 127.0.0.1...")
open_ports = []
for port in range(50000, 65000):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.005)
    result = s.connect_ex(('127.0.0.1', port))
    if result == 0:
        open_ports.append(port)
    s.close()

print(f"Open ports found: {open_ports}")
