import json

with open("scratch/supabase_openapi.json", "r") as f:
    schema = json.load(f)

definitions = schema.get("definitions", {})
print("Exposed definitions/tables/views:")
for key in sorted(definitions.keys()):
    print(f"- {key}")
