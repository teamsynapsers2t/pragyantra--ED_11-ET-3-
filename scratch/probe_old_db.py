import requests

SUPABASE_URL = "https://zasguohfgbgwikjnanqi.supabase.co"
# Let's use the anon key from the original env file
SUPABASE_ANON_KEY = "sb_publishable_-kO5DTluDwv-H8Fu0Q3QwQ_UOqxl0K9"

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}

try:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/questions?limit=5", headers=headers)
    print("Old DB /questions status_code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"Fetched {len(data)} rows from old DB.")
        if len(data) > 0:
            print("First row:", data[0])
    else:
        print("Old DB failed:", res.text)
except Exception as e:
    print("Error querying old DB:", e)
