import uuid

def test_idempotency_key_duplicate_prevention(client):
    email = f"idemp_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assets = client.get("/api/v1/assets").json()
    asset_id = assets[0]["id"]
    key = f"key_{uuid.uuid4().hex}"

    # First submission
    resp1 = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 2.0,
        "idempotency_key": key
    }, headers=headers)
    assert resp1.status_code == 201
    order1 = resp1.json()

    # Second submission with identical key
    resp2 = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 2.0,
        "idempotency_key": key
    }, headers=headers)
    assert resp2.status_code == 201
    order2 = resp2.json()

    # Must return exact same order without duplicate execution
    assert order1["id"] == order2["id"]

    # Verify positions: only 2 shares, not 4!
    portfolio = client.get("/api/v1/portfolio", headers=headers).json()
    pos = portfolio["positions"][0]
    assert float(pos["quantity"]) == 2.0

def test_cross_user_authorization_isolation(client, user_a_auth, user_b_auth):
    assets = client.get("/api/v1/assets").json()
    asset_id = assets[0]["id"]

    # User A places a limit order
    resp = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "BUY",
        "order_type": "LIMIT",
        "quantity": 1.0,
        "limit_price": 500.0
    }, headers=user_a_auth)
    order_a_id = resp.json()["id"]

    # User B attempts to access User A's order -> 404
    get_resp = client.get(f"/api/v1/orders/{order_a_id}", headers=user_b_auth)
    assert get_resp.status_code == 404

    # User B attempts to cancel User A's order -> 404
    cancel_resp = client.post(f"/api/v1/orders/{order_a_id}/cancel", headers=user_b_auth)
    assert cancel_resp.status_code == 404

