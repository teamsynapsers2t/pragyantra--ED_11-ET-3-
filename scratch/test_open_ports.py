import socket
import urllib.request
import urllib.error

ports = [51778, 51888, 53913, 53914, 53916, 53917]

print("=== Testing Open Ports ===")
for port in ports:
    # 1. Try HTTP GET
    try:
        url = f"http://127.0.0.1:{port}/"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2) as response:
            html = response.read(100)
            print(f"Port {port} (HTTP): SUCCESS (Status {response.status}) -> {html[:50]}")
    except urllib.error.HTTPError as e:
        print(f"Port {port} (HTTP): HTTPError {e.code} -> {e.reason}")
    except urllib.error.URLError as e:
        print(f"Port {port} (HTTP): URLError -> {e.reason}")
    except Exception as e:
        print(f"Port {port} (HTTP): Exception -> {e}")

    # 2. Try raw socket connect and read
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect(('127.0.0.1', port))
        # Send a generic request
        s.sendall(b"GET / HTTP/1.0\r\n\r\n")
        data = s.recv(1024)
        print(f"Port {port} (Raw socket response): {repr(data[:100])}")
        s.close()
    except Exception as e:
        print(f"Port {port} (Raw socket exception): {e}")
