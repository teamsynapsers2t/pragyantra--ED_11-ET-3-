import os
import requests
import json

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
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"

print("--- Calling fn_detect_root_flaws RPC ---")
rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/fn_detect_root_flaws"
payload = {
    "p_user_id": TEST_USER_UUID
}
res = requests.post(rpc_url, headers=headers, json=payload)
print(f"Status Code: {res.status_code}")
print(f"Response: {res.text}")

print("\n--- Querying weakness_signals after RPC call ---")
url = f"{SUPABASE_URL}/rest/v1/weakness_signals?user_id=eq.{TEST_USER_UUID}"
res_signals = requests.get(url, headers=headers)
if res_signals.status_code == 200:
    print(json.dumps(res_signals.json(), indent=2))
else:
    print(f"Error: {res_signals.status_code} - {res_signals.text}")
