import psycopg2

dsn = "postgres://postgres:postgres@localhost:51214/postgres?sslmode=disable"
try:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # List all tables in current database
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    """)
    tables = cur.fetchall()
    print("Tables in postgres database:", [t[0] for t in tables])
    
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
