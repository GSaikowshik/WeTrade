def test_list_and_search_assets(client, user_a_auth):
    resp = client.get("/api/v1/assets")
    assert resp.status_code == 200
    assets = resp.json()
    assert len(assets) >= 6
    symbols = [a["symbol"] for a in assets]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols
    assert "INFY" in symbols

    # Search
    search_resp = client.get("/api/v1/assets?query=Reliance")
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) == 1
    assert results[0]["symbol"] == "RELIANCE"

def test_asset_bars_and_quotes(client):
    assets_resp = client.get("/api/v1/assets")
    asset_id = assets_resp.json()[0]["id"]

    quotes_resp = client.get(f"/api/v1/assets/{asset_id}/quotes")
    assert quotes_resp.status_code == 200
    quotes = quotes_resp.json()
    assert len(quotes) >= 1
    assert quotes[0]["data_status"] == "demo"

    bars_resp = client.get(f"/api/v1/assets/{asset_id}/bars?interval=1D")
    assert bars_resp.status_code == 200
    bars = bars_resp.json()
    assert len(bars) >= 30

def test_watchlist_workflow(client, user_a_auth):
    assets_resp = client.get("/api/v1/assets")
    asset_id = assets_resp.json()[0]["id"]

    # Add to watchlist
    add_resp = client.post("/api/v1/watchlist", json={"asset_id": asset_id}, headers=user_a_auth)
    assert add_resp.status_code in [200, 201]

    # Verify in watchlist
    get_resp = client.get("/api/v1/watchlist", headers=user_a_auth)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert any(i["asset_id"] == asset_id for i in items)

    # Remove from watchlist
    del_resp = client.delete(f"/api/v1/watchlist/{asset_id}", headers=user_a_auth)
    assert del_resp.status_code == 204

    # Verify removed
    get_resp_after = client.get("/api/v1/watchlist", headers=user_a_auth)
    assert not any(i["asset_id"] == asset_id for i in get_resp_after.json())

