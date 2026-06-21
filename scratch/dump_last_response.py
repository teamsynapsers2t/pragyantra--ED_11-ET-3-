import json
import os

log_path = r"C:\Users\tumra\.gemini\antigravity-ide\brain\fd51d471-ef11-44b7-ba5a-58d1dc40fa33\.system_generated\logs\transcript.jsonl"

if not os.path.exists(log_path):
    print("Log file does not exist.")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- STEP 1264 (FINAL RESPONSE) ---")
step_1264 = json.loads(lines[1264])
print(step_1264.get("content"))

print("\n--- STEP 1220 (PREVIOUS USER INPUT) ---")
step_1220 = json.loads(lines[1220])
print(step_1220.get("content"))
