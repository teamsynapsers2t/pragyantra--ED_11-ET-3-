import psycopg2

ports = [51213, 51214, 51215, 51216]
for port in ports:
    dsn = f"postgres://postgres:postgres@localhost:{port}/template1?sslmode=disable"
    print(f"Trying port {port}...")
    try:
        conn = psycopg2.connect(dsn, connect_timeout=3)
        print(f"SUCCESS on port {port}!")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Version:", cur.fetchone())
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed on port {port}: {str(e)[:150]}")
