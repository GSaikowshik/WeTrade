import uuid

def test_user_registration_and_starting_balance(client):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "strongPassword123",
        "full_name": "Test User"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["email"] == unique_email
    assert data["full_name"] == "Test User"

    headers = {"Authorization": f"Bearer {data['access_token']}"}

    # Verify wallet has starting balance of ₹100,000
    portfolio_resp = client.get("/api/v1/portfolio", headers=headers)
    assert portfolio_resp.status_code == 200
    portfolio = portfolio_resp.json()
    assert float(portfolio["available_cash"]) == 100000.0
    assert float(portfolio["total_portfolio_value"]) == 100000.0

    # Verify initial ledger entry
    ledger_resp = client.get("/api/v1/ledger", headers=headers)
    assert ledger_resp.status_code == 200
    ledger = ledger_resp.json()
    assert len(ledger) >= 1
    assert ledger[0]["entry_type"] == "DEPOSIT"
    assert float(ledger[0]["amount"]) == 100000.0
    assert float(ledger[0]["resulting_balance"]) == 100000.0

def test_duplicate_registration_fails(client):
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    resp1 = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json={"email": email, "password": "password123"})
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]

def test_login_flow(client):
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "myPassword999"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})

    # Wrong password
    bad_login = client.post("/api/v1/auth/login", json={"email": email, "password": "wrong"})
    assert bad_login.status_code == 401

    # Correct password
    good_login = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()

def test_unauthenticated_protected_route(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401

