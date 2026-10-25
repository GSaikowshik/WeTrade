import uuid

def test_trade_journal_lifecycle(client, user_a_auth):
    assets = client.get("/api/v1/assets").json()
    asset_id = assets[0]["id"]

    # 1. Create journal entry
    create_resp = client.post("/api/v1/journal", json={
        "asset_id": asset_id,
        "thesis": "Breakout above 20-day moving average with high volume",
        "planned_entry": 2950.0,
        "planned_stop": 2900.0,
        "planned_target": 3100.0,
        "lesson_learned": "Stick to strict stop loss"
    }, headers=user_a_auth)
    assert create_resp.status_code == 201
    entry = create_resp.json()
    entry_id = entry["id"]
    assert entry["thesis"] == "Breakout above 20-day moving average with high volume"
    assert entry["asset_symbol"] == assets[0]["symbol"]

    # 2. List journal entries
    list_resp = client.get("/api/v1/journal", headers=user_a_auth)
    assert list_resp.status_code == 200
    entries = list_resp.json()
    assert any(e["id"] == entry_id for e in entries)

    # 3. Patch entry
    patch_resp = client.patch(f"/api/v1/journal/{entry_id}", json={
        "exit_reason": "Hit target at 3100",
        "lesson_learned": "Great patience throughout the trade"
    }, headers=user_a_auth)
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["exit_reason"] == "Hit target at 3100"

    # 4. Delete entry
    del_resp = client.delete(f"/api/v1/journal/{entry_id}", headers=user_a_auth)
    assert del_resp.status_code == 204

def test_analytics_summary_endpoint(client, user_a_auth):
    resp = client.get("/api/v1/analytics/summary", headers=user_a_auth)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_trades" in data
    assert "win_rate_pct" in data
    assert "net_pnl" in data

