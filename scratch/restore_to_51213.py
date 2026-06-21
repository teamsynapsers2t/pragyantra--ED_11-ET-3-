import os

# Original base64 config with localhost:51214 and localhost:51215
original_b64 = "eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xMCZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MTAmY29ubmVjdF90aW1lb3V0PTAmbWF4X2lkbGVfY29ubmVjdGlvbl9saWZldGltZT0wJnBvb2xfdGltZW91dD0wJnNvY2tldF90aW1lb3V0PTAifQ"

# Reconstruct the URL with the original proxy port 51213
new_db_url = f"prisma+postgres://localhost:51213/?api_key={original_b64}"

# Update .env
if os.path.exists(".env"):
    with open(".env", "r") as f:
        lines = f.readlines()
        
    with open(".env", "w") as f:
        for line in lines:
            if line.startswith("DATABASE_URL="):
                f.write(f'DATABASE_URL="{new_db_url}"\n')
            else:
                f.write(line)
    print("Updated DATABASE_URL in .env to localhost:51213")

# Update paper-ai/.env if exists
if os.path.exists("paper-ai/.env"):
    with open("paper-ai/.env", "r") as f:
        lines = f.readlines()
        
    with open("paper-ai/.env", "w") as f:
        for line in lines:
            if line.startswith("DATABASE_URL="):
                f.write(f'DATABASE_URL="{new_db_url}"\n')
            else:
                f.write(line)
    print("Updated DATABASE_URL in paper-ai/.env to localhost:51213")
