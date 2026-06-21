import urllib.request
import json
import time
import websocket

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

ws = websocket.create_connection(ws_url, suppress_origin=True)

# Trigger the audit
trigger_cmd = {
    "id": 1,
    "method": "Runtime.evaluate",
    "params": {
        "expression": "window.seed_result = null; fetch('/api/audit/run', { method: 'POST' }).then(res => res.json()).then(data => window.seed_result = data).catch(err => window.seed_result = { error: err.message });"
    }
}
ws.send(json.dumps(trigger_cmd))
print("Triggered audit route. Waiting up to 60 seconds for completion...")

# Poll window.seed_result
for attempt in range(60):
    time.sleep(1)
    check_cmd = {
        "id": 2 + attempt,
        "method": "Runtime.evaluate",
        "params": {
            "expression": "window.seed_result",
            "returnByValue": True
        }
    }
    ws.send(json.dumps(check_cmd))
    res = json.loads(ws.recv())
    val = res.get("result", {}).get("result", {}).get("value")
    if val is not None:
        print("RESULT RECEIVED!")
        print(json.dumps(val, indent=2))
        break
    else:
        print(f"Still waiting... ({attempt+1}s)")

ws.close()
