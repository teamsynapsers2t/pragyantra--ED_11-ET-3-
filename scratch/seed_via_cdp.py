import urllib.request
import json
import time

try:
    with urllib.request.urlopen("http://127.0.0.1:9222/json") as response:
        pages = json.loads(response.read().decode())
except Exception as e:
    print(f"Error connecting to Chrome debugger: {e}")
    exit(1)

target_page = None
for page in pages:
    if "localhost:3000/audit" in page.get("url", ""):
        target_page = page
        break

if not target_page:
    print("Audit page not found in Chrome pages:")
    for page in pages:
        print(f"- {page.get('url')}")
    exit(1)

ws_url = target_page["webSocketDebuggerUrl"]
print(f"Connecting to WebSocket: {ws_url}")

try:
    import websocket
except ImportError:
    import subprocess
    import sys
    print("Installing websocket-client...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websocket-client"])
    import websocket

ws = websocket.create_connection(ws_url, suppress_origin=True)

trigger_cmd = {
    "id": 1,
    "method": "Runtime.evaluate",
    "params": {
        "expression": "fetch('/api/admin/seed-chapters', { method: 'POST' }).then(res => res.json()).then(data => window.seed_result = data).catch(err => window.seed_result = { error: err.message });"
    }
}
ws.send(json.dumps(trigger_cmd))
print("Triggered seed-chapters fetch. Waiting 4 seconds...")
time.sleep(4)

retrieve_cmd = {
    "id": 2,
    "method": "Runtime.evaluate",
    "params": {
        "expression": "window.seed_result",
        "returnByValue": True
    }
}
ws.send(json.dumps(retrieve_cmd))

result = ws.recv()
data = json.loads(result)
if "result" in data and "result" in data["result"]:
    val = data["result"]["result"].get("value")
    print("RESULT_START")
    print(json.dumps(val, indent=2))
    print("RESULT_END")
else:
    print("Failed to retrieve result:", data)

ws.close()
