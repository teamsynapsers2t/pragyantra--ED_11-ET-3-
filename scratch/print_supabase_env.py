import os

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
print("NEXT_PUBLIC_SUPABASE_URL:", env.get("NEXT_PUBLIC_SUPABASE_URL"))
print("NEXT_PUBLIC_SUPABASE_ANON_KEY:", env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")[:20] + "...")
