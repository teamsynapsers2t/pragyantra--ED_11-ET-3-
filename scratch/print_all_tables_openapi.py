import json

with open(r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\supabase_openapi.json", "r") as f:
    spec = json.load(f)

definitions = spec.get("definitions", {})
for name, val in definitions.items():
    print(f"\nTable: {name}")
    properties = val.get("properties", {})
    required = val.get("required", [])
    for prop_name, prop_val in properties.items():
        req_star = "*" if prop_name in required else ""
        print(f"  - {prop_name}{req_star}: {prop_val.get('type')} ({prop_val.get('format', 'no format')}) - {prop_val.get('description', '')}")
