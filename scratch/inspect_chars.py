import re

with open("c:/Users/tumra/Documents/paper-AI/paper-ai/scratch/all_mentions_context.txt", "r", errors="ignore") as f:
    content = f.read()

# Search for patterns like CREATE FUNCTION, CREATE TRIGGER, etc.
# We will search for 'fn_apply_attempt' and extract the block around it if it looks like PL/pgSQL code
matches = re.finditer(r"fn_apply_attempt", content, re.IGNORECASE)
for idx, m in enumerate(matches):
    start = max(0, m.start() - 500)
    end = min(len(content), m.start() + 4000)
    snippet = content[start:end]
    if "language plpgsql" in snippet.lower() or "declare" in snippet.lower() or "begin" in snippet.lower():
        print(f"Match {idx+1} at index {m.start()}:")
        print(snippet)
        print("=" * 80)
