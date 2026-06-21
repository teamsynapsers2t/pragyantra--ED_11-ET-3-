import requests
import json

SUPABASE_URL = "https://zasguohfgbgwikjnanqi.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_-kO5DTluDwv-H8Fu0Q3QwQ_UOqxl0K9" # Wait, is this the anon key? Let's check the old env or run it.
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}

endpoints = ["chapters", "subjects", "questions"]
for ep in endpoints:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/{ep}?limit=5", headers=headers)
    print(f"Endpoint '{ep}' status_code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Fetched {len(data)} rows.")
        if len(data) > 0:
            print("First row:", json.dumps(data[0], indent=2))
    else:
        print("Failed:", res.text)
