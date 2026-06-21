import socket

host = "db.pdnpfpjtbpmuvzopvren.supabase.co"
port = 6543

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5)
try:
    s.connect((host, port))
    print(f"Port {port} is OPEN!")
    s.close()
except Exception as e:
    print(f"Port {port} is CLOSED or unreachable: {e}")
