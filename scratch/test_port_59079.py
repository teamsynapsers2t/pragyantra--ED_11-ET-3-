import os
import psycopg2

def load_env():
    env = {}
    for path in [".env", ".env.local"]:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('"').strip("'")
                            env[key] = val
    return env

env = load_env()
db_url = env.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

# Replace proxy port to 59079
db_url = db_url.replace(":51602/", ":59079/")
# Also try replacing to 56279
db_url_alt = db_url.replace(":59079/", ":56279/")

for url in [db_url, db_url_alt]:
    connection_string = url.replace("prisma+postgres://", "postgres://")
    print(f"Connecting to: {connection_string.split('?')[0]}?api_key=...")
    try:
        conn = psycopg2.connect(connection_string)
        print("Connected successfully!")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Version:", cur.fetchone())
        cur.close()
        conn.close()
        break
    except Exception as e:
        print("Failed:", e)
