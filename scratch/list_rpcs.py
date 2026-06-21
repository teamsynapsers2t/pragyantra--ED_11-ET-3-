import json
import os

path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\supabase_openapi.json"
if os.path.exists(path):
    with open(path, "r") as f:
        data = json.load(f)
    paths = data.get("paths", {})
    for p in sorted(paths.keys()):
        if p.startswith("/rpc/"):
            print(p)
else:
    print("supabase_openapi.json not found")
