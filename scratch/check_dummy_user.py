import os
import requests

def load_env():
    env = {}
    if os.path.exists(".env.local"):
        with open(".env.local", "r") as f:
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
url = env.get("NEXT_PUBLIC_SUPABASE_URL")
key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

# Check mapping for question 672
res = requests.get(f"{url}/rest/v1/question_concepts?question_id=eq.672", headers=headers)
print("Question 672 Concepts:", res.json())
