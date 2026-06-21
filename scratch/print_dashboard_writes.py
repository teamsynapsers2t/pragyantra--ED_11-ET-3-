import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            tool_calls = step.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name", "")
                args = tc.get("args", {})
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except:
                        pass
                
                target_file = args.get("TargetFile", "") if hasattr(args, 'get') else ""
                if "page.tsx" in target_file and "dashboard" in target_file:
                    print(f"Step {idx}: tool={name}")
                    print(f"  Description: {args.get('Description')}")
                    if name == "write_to_file":
                        code = args.get("CodeContent", "")
                        print(f"  CodeContent length: {len(code)}")
                        print(f"  Snippet: {code[:200]}...")
                    elif name == "replace_file_content":
                        target = args.get("TargetContent", "")
                        repl = args.get("ReplacementContent", "")
                        print(f"  Replace: target len={len(target)}, repl len={len(repl)}")
                        print(f"  Target snippet: {target[:100]}...")
                        print(f"  Replacement snippet: {repl[:100]}...")
                    elif name == "multi_replace_file_content":
                        chunks = args.get("ReplacementChunks", [])
                        print(f"  MultiReplace: {len(chunks)} chunks")
                        for c_idx, c in enumerate(chunks):
                            print(f"    Chunk {c_idx}: target len={len(c.get('TargetContent', ''))}, repl len={len(c.get('ReplacementContent', ''))}")
        except Exception as e:
            pass
