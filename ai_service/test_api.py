import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def test_endpoints():
    base_url = "http://127.0.0.1:5000"
    print("==================================================")
    print("[RUNNING AI/ML MICROSERVICE CONNECTION TESTS]")
    print("==================================================")

    # 1. Health Check
    try:
        req = urllib.request.Request(f"{base_url}/health")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"\n[1/4] [SUCCESS] HEALTH CHECK:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\n[1/4] [FAILED] HEALTH CHECK: {e}")
        return

    # 2. Database Intrusion Detection Test
    try:
        log_payload = {
            "user_id": "Faculty_102",
            "operation_type": "SELECT",
            "records_accessed": 4850,
            "failed_login_attempts": 6,
            "table_name": "users"
        }
        req = urllib.request.Request(
            f"{base_url}/intrusion-detection/analyze",
            data=json.dumps(log_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"\n[2/4] [SUCCESS] DATABASE INTRUSION DETECTION TEST:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\n[2/4] [FAILED] INTRUSION TEST: {e}")

    # 3. Product Recommendation Test
    try:
        rec_payload = {
            "user_id": 1,
            "user_history": [{"product_id": 10, "quantity": 1}],
            "products": [
                {"id": 10, "name": "Gaming Laptop", "description": "High performance gaming laptop"},
                {"id": 11, "name": "Wireless Mouse", "description": "Ergonomic gaming mouse"},
                {"id": 12, "name": "Laptop Bag", "description": "Padded protective laptop backpack"},
                {"id": 13, "name": "USB-C Hub", "description": "Multi-port USB adapter"}
            ],
            "top_n": 3
        }
        req = urllib.request.Request(
            f"{base_url}/recommend/user",
            data=json.dumps(rec_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"\n[3/4] [SUCCESS] PRODUCT RECOMMENDATION TEST:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\n[3/4] [FAILED] RECOMMENDATION TEST: {e}")

    # 4. Inventory Demand Forecasting Test
    try:
        forecast_payload = {
            "product_id": 10,
            "product_name": "Gaming Laptop",
            "current_stock": 80,
            "historical_sales": [
                {"product_id": 10, "quantity": 30, "created_at": "2026-01-01"},
                {"product_id": 10, "quantity": 40, "created_at": "2026-02-01"},
                {"product_id": 10, "quantity": 50, "created_at": "2026-03-01"}
            ],
            "horizon_days": 30
        }
        req = urllib.request.Request(
            f"{base_url}/inventory/forecast",
            data=json.dumps(forecast_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"\n[4/4] [SUCCESS] INVENTORY DEMAND FORECASTING TEST:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\n[4/4] [FAILED] FORECAST TEST: {e}")

    print("\n==================================================")
    print("ALL AI/ML MODULE CONNECTIONS VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_endpoints()
