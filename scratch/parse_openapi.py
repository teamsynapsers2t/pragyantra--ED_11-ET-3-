import json

with open(r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\supabase_openapi.json", "r") as f:
    spec = json.load(f)

paths = spec.get("paths", {})
for rpc in ["/rpc/rls_auto_enable", "/rpc/fn_generate_weakness_report", "/rpc/fn_apply_attempt", "/rpc/fn_detect_root_flaws"]:
    if rpc in paths:
        print(f"\n=== Details for {rpc} ===")
        post_op = paths[rpc].get("post", {})
        print("Summary:", post_op.get("summary"))
        print("Description:", post_op.get("description"))
        parameters = post_op.get("parameters", [])
        print("Parameters:")
        for p in parameters:
            print(f"  - Name: {p.get('name')}, In: {p.get('in')}, Schema: {p.get('schema')}")
        
        # Check responses
        responses = post_op.get("responses", {})
        print("Responses:")
        for code, resp in responses.items():
            print(f"  - Code {code}: {resp.get('description')}")
