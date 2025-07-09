import requests

BASE_URL = "http://localhost:7123"

def test_home():
    r = requests.get(f"{BASE_URL}/")
    print("Home:", r.json())

def test_move():
    # Example: move north
    r = requests.post(f"{BASE_URL}/move/north")
    print("Move north:", r.json())

def test_slew():
    payload = {"ra": 10.684, "dec": 41.269}  # Example RA/DEC
    r = requests.post(f"{BASE_URL}/slew", json=payload)
    print("Slew:", r.json())

def test_abort():
    r = requests.post(f"{BASE_URL}/abort")
    print("Abort:", r.json())

def test_sync():
    payload = {"ra": 10.684, "dec": 41.269}
    r = requests.post(f"{BASE_URL}/sync", json=payload)
    print("Sync:", r.json())

def test_park():
    r = requests.post(f"{BASE_URL}/park")
    print("Park:", r.json())

def test_unpark():
    r = requests.post(f"{BASE_URL}/unpark")
    print("Unpark:", r.json())

def test_position():
    r = requests.get(f"{BASE_URL}/position")
    print("Position:", r.json())

def test_info():
    r = requests.get(f"{BASE_URL}/info")
    print("Info:", r.json())

def test_align():
    r = requests.post(f"{BASE_URL}/align", json={"mode": "some_mode"})
    print("Align:", r.json())

def test_set_time():
    # ISO format example datetime string
    payload = {"utc": "2025-07-09T12:00:00"}
    r = requests.post(f"{BASE_URL}/set_time", json=payload)
    print("Set Time:", r.json())

if __name__ == "__main__":
    test_home()
    test_move()
    test_slew()
    test_abort()
    test_sync()    #
    test_park()
    test_unpark()
    test_position()
    test_info()
    test_align()
    test_set_time()
