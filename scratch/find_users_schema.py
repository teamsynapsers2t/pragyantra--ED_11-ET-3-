import json

with open("scratch/supabase_openapi.json", "r") as f:
    schema = json.load(f)

definitions = schema.get("definitions", {})
if "users" in definitions:
    print(json.dumps(definitions["users"], indent=2))
else:
    print("users table definition not found in OpenAPI schema")
