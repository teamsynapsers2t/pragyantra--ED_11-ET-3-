import json

with open("scratch/supabase_openapi.json", "r") as f:
    schema = json.load(f)

print("Available paths starting with /rpc/:")
for path in schema.get("paths", {}):
    if path.startswith("/rpc/"):
        print(path)
