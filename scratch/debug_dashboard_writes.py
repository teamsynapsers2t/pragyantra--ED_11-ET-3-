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
                args = tc.get("arguments", {})
                # Let's inspect all write/replace files
                if "file" in name or "replace" in name or "write" in name:
                    # Print raw args to see structure
                    print(f"Step {idx}: tool={name}")
                    print(f"  args type: {type(args)}")
                    print(f"  args content: {str(args)[:300]}")
        except Exception as e:
            pass
