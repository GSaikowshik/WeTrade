def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database_connected"] is True
    assert "We Trade" in data["service"]
    assert "virtual" in data["disclaimer"].lower()

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")
    if "text/html" in content_type:
        assert "we trade" in response.text.lower()
    else:
        data = response.json()
        assert "We Trade API" in data["message"]
