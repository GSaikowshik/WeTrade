import uuid
from decimal import Decimal

def test_buy_market_order_and_ledger(client):
    email = f"trader_buy_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Get asset (e.g. INFY ~1884.25)
    assets = client.get("/api/v1/assets").json()
    infy = next(a for a in assets if a["symbol"] == "INFY")
    asset_id = infy["id"]

    # Place buy market order for 10 shares
    buy_resp = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 10.0,
        "idempotency_key": str(uuid.uuid4())
    }, headers=headers)
    assert buy_resp.status_code == 201
    order = buy_resp.json()
    assert order["status"] == "FILLED"
    assert float(order["filled_quantity"]) == 10.0
    fill_price = float(order["average_fill_price"])
    fees = float(order["fees_paid"])
    assert fill_price > 0
    assert fees > 0

    expected_notional = 10.0 * fill_price
    expected_total_cost = expected_notional + fees

    # Check cash deduction and position
    portfolio = client.get("/api/v1/portfolio", headers=headers).json()
    assert float(portfolio["available_cash"]) == pytest_approx(100000.0 - expected_total_cost)

    positions = portfolio["positions"]
    assert len(positions) == 1
    assert positions[0]["symbol"] == "INFY"
    assert float(positions[0]["quantity"]) == 10.0

    # Verify ledger entries (1 DEPOSIT + 1 ORDER_BUY + 1 FEE)
    ledger = client.get("/api/v1/ledger", headers=headers).json()
    entry_types = [entry["entry_type"] for entry in ledger]
    assert "DEPOSIT" in entry_types
    assert "ORDER_BUY" in entry_types
    assert "FEE" in entry_types

def test_unaffordable_buy_order_rejected(client):
    email = f"trader_broke_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assets = client.get("/api/v1/assets").json()
    reliance = next(a for a in assets if a["symbol"] == "RELIANCE")

    # Try to buy 10,000 shares of Reliance (~30,000,000 INR, starting cash is only 100,000)
    buy_resp = client.post("/api/v1/orders", json={
        "asset_id": reliance["id"],
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 10000.0
    }, headers=headers)
    assert buy_resp.status_code == 201
    order = buy_resp.json()
    assert order["status"] == "REJECTED"
    assert "Insufficient funds" in order["rejection_reason"]

    # Verify cash unchanged
    portfolio = client.get("/api/v1/portfolio", headers=headers).json()
    assert float(portfolio["available_cash"]) == 100000.0
    assert len(portfolio["positions"]) == 0

def test_oversell_rejected(client):
    email = f"trader_oversell_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assets = client.get("/api/v1/assets").json()
    tcs = next(a for a in assets if a["symbol"] == "TCS")

    # Try to sell 5 shares when owning 0
    sell_resp = client.post("/api/v1/orders", json={
        "asset_id": tcs["id"],
        "side": "SELL",
        "order_type": "MARKET",
        "quantity": 5.0
    }, headers=headers)
    assert sell_resp.status_code == 201
    order = sell_resp.json()
    assert order["status"] == "REJECTED"
    assert "Insufficient position" in order["rejection_reason"]

def test_sell_market_order_and_realized_pnl(client):
    email = f"trader_sell_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assets = client.get("/api/v1/assets").json()
    itc = next(a for a in assets if a["symbol"] == "ITC")
    asset_id = itc["id"]

    # 1. Buy 20 shares
    buy_resp = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 20.0
    }, headers=headers)
    assert buy_resp.json()["status"] == "FILLED"

    # 2. Sell 10 shares
    sell_resp = client.post("/api/v1/orders", json={
        "asset_id": asset_id,
        "side": "SELL",
        "order_type": "MARKET",
        "quantity": 10.0
    }, headers=headers)
    assert sell_resp.status_code == 201
    order = sell_resp.json()
    assert order["status"] == "FILLED"

    # Verify positions and realized P&L
    portfolio = client.get("/api/v1/portfolio", headers=headers).json()
    pos = portfolio["positions"][0]
    assert float(pos["quantity"]) == 10.0
    assert "realized_pnl" in pos

def test_limit_order_placement_and_cancellation(client):
    email = f"trader_limit_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assets = client.get("/api/v1/assets").json()
    reliance = next(a for a in assets if a["symbol"] == "RELIANCE")

    # Place buy limit far below current price (~2950) at 1000 INR
    order_resp = client.post("/api/v1/orders", json={
        "asset_id": reliance["id"],
        "side": "BUY",
        "order_type": "LIMIT",
        "quantity": 1.0,
        "limit_price": 1000.0
    }, headers=headers)
    assert order_resp.status_code == 201
    order = order_resp.json()
    assert order["status"] == "PENDING"
    order_id = order["id"]

    # Cancel the limit order
    cancel_resp = client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

def pytest_approx(expected, rel=1e-3):
    import pytest
    return pytest.approx(expected, rel=rel)

