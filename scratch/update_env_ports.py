import os
import base64
import json
import re

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

if not db_url or "api_key=" not in db_url:
    print("Valid DATABASE_URL not found in .env.")
    exit(1)

# Extract api_key base64 string
prefix, api_key_b64 = db_url.split("api_key=", 1)
api_key_b64 = api_key_b64.strip().strip('"').strip("'")

# Decode base64
try:
    # URL-safe replacements
    b64_str = api_key_b64.replace("_", "/").replace("-", "+")
    
    # Add padding if needed
    missing_padding = len(b64_str) % 4
    if missing_padding:
        b64_str += '=' * (4 - missing_padding)
        
    decoded_bytes = base64.b64decode(b64_str)
    decoded_str = decoded_bytes.decode('utf-8')
    config = json.loads(decoded_str)
    print("Original Decoded Config:", json.dumps(config, indent=2))
    
    # We found that Antigravity IDE is listening on 51602 (proxy) and 51603 (database)
    # Let's map host to 127.0.0.1 and ports to 51603, and 51604 using regex
    config['databaseUrl'] = re.sub(r'@(localhost|127\.0\.0\.1):\d+/', '@127.0.0.1:51603/', config['databaseUrl'])
    config['shadowDatabaseUrl'] = re.sub(r'@(localhost|127\.0\.0\.1):\d+/', '@127.0.0.1:51604/', config['shadowDatabaseUrl'])
    
    print("\nUpdated Config:", json.dumps(config, indent=2))
    
    # Encode back to base64
    new_json_bytes = json.dumps(config).encode('utf-8')
    new_b64 = base64.b64encode(new_json_bytes).decode('utf-8')
    
    # Replace back to URL-safe base64
    new_b64_safe = new_b64.replace("/", "_").replace("+", "-").rstrip("=")
    
    # Reconstruct DATABASE_URL with new proxy port 51602 (making sure host is 127.0.0.1 for proxy too!)
    new_prefix = re.sub(r'://(localhost|127\.0\.0\.1):\d+/\?', '://127.0.0.1:51602/?', prefix)
    new_db_url = f"{new_prefix}api_key={new_b64_safe}"
    
    # Write back to .env
    with open(".env", "r") as f:
        lines = f.readlines()
        
    with open(".env", "w") as f:
        for line in lines:
            if line.startswith("DATABASE_URL="):
                f.write(f'DATABASE_URL="{new_db_url}"\n')
            else:
                f.write(line)
                
    print("\nSuccessfully updated DATABASE_URL in .env with 127.0.0.1 and new ports!")
except Exception as e:
    print("Error:", e)
