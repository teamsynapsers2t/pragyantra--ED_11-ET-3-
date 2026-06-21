import psycopg2

try:
    print("Connecting directly to PostgreSQL engine on port 51603...")
    conn = psycopg2.connect(
        host="127.0.0.1",
        database="template1",
        user="postgres",
        password="postgres",
        port=51603,
        connect_timeout=3
    )
    print("SUCCESS! Connected directly to local PostgreSQL engine!")
    
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("Version:", cur.fetchone())
    
    # Run the schema changes
    print("\nRunning schema alter table commands...")
    cur.execute("ALTER TABLE public.question_options ADD COLUMN IF NOT EXISTS error_type TEXT;")
    cur.execute("ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS error_type TEXT;")
    conn.commit()
    print("SUCCESS! Added missing error_type columns!")
    
    cur.close()
    conn.close()
except Exception as e:
    print("Direct connection failed:", e)
