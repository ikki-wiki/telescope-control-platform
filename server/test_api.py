import requests

BASE_URL = "http://localhost:7123"

def safe_request(method, endpoint, payload=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            r = requests.get(url)
        elif method == "POST":
            r = requests.post(url, json=payload)
        else:
            print(f"Unsupported method {method}")
            return

        print(f"\n===> {method} {endpoint}")
        print(f"Status Code: {r.status_code}")
        print("Response Text:", r.text.strip() or "[empty]")

        try:
            json_response = r.json()
            print("Parsed JSON:", json_response)
        except Exception as e:
            print(f"⚠️  Failed to parse JSON: {e}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Request to {url} failed: {e}")

def test_home():
    safe_request("GET", "/")

def test_move():
    safe_request("POST", "/api/move/north")

def test_slew():
    payload = {"ra": 10.684, "dec": 41.269}
    safe_request("POST", "/api/slew", payload)

def test_abort():
    safe_request("POST", "/api/abort")

def test_sync():
    payload = {"ra": 10.684, "dec": 41.269}
    safe_request("POST", "/api/sync", payload)

def test_park():
    safe_request("POST", "/api/park")

def test_unpark():
    safe_request("POST", "/api/unpark")

def test_position():
    safe_request("GET", "/api/position")

def test_info():
    safe_request("GET", "/api/info")

def test_align():
    safe_request("POST", "/api/align", {"mode": "some_mode"})

def test_set_time():
    payload = {"utc": "2025-07-09T12:00:00"}
    safe_request("POST", "/api/set_time", payload)

if __name__ == "__main__":
    test_home()
    test_move()
    test_slew()
    test_abort()
    test_sync()
    test_park()
    test_unpark()
    test_position()
    test_info()
    test_align()
    test_set_time()
