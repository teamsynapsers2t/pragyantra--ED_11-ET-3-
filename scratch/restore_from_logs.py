import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Users\tumra\Documents\paper-AI\paper-ai\scratch\viewed_dashboard_800.txt"

if not os.path.exists(log_path):
    print("Log file does not exist at:", log_path)
    exit(1)

print("Reading transcript logs...")
found_content = None
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            # Look for the tool call that viewed dashboard/page.tsx
            if step.get("type") == "VIEW_FILE" or "view_file" in str(step):
                content = step.get("content", "")
                if "export default function DashboardPage" in content:
                    found_content = content
                    print("Found viewed file content in log step!")
        except Exception as e:
            pass

if found_content:
    with open(out_path, 'w', encoding='utf-8') as f_out:
        # Strip line numbers like "1: ", "2: "
        lines = found_content.split('\n')
        clean_lines = []
        for l in lines:
            if ":" in l[:10]:
                parts = l.split(":", 1)
                clean_lines.append(parts[1].lstrip(' '))
            else:
                clean_lines.append(l)
        f_out.write('\n'.join(clean_lines))
    print(f"Successfully wrote clean content to {out_path}!")
else:
    print("Could not find the viewed dashboard file content in the logs.")
