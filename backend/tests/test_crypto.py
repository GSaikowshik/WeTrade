from unittest.mock import patch, AsyncMock
import pytest
import httpx
from app.services.crypto import validate_and_parse_price, SUPPORTED_CRYPTO_SYMBOLS

# --- Unit Tests for validate_and_parse_price ---

def test_validate_and_parse_price_valid():
    assert validate_and_parse_price("67420.50") == 67420.50
    assert validate_and_parse_price("0.0001") == 0.0001
    assert validate_and_parse_price(3250.75) == 3250.75

def test_validate_and_parse_price_invalid_and_non_finite():
    for bad_value in ["0", "0.0", "-15.5", "abc", "NaN", "Infinity", "-Infinity", "", None, []]:
        with pytest.raises(ValueError):
            validate_and_parse_price(bad_value)


# --- API Route Tests with Mocked Upstream Binance Calls ---

def test_get_crypto_ticker_success(client):
    mock_resp = httpx.Response(
        status_code=200,
        json={"symbol": "BTCUSDT", "price": "67500.25"},
        request=httpx.Request("GET", "https://data-api.binance.vision/api/v3/ticker/price")
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "BTCUSDT"
    assert data["price"] == 67500.25
    assert data["quote_currency"] == "USDT"
    assert data["source"] == "binance_public_spot"
    assert "fetched_at" in data
    assert "T" in data["fetched_at"]


def test_get_crypto_tickers_all_concurrent(client):
    def fake_get(url, params=None):
        symbol = (params or {}).get("symbol", "BTCUSDT")
        prices = {
            "BTCUSDT": "67000.00",
            "ETHUSDT": "3500.50",
            "SOLUSDT": "180.25",
        }
        return httpx.Response(
            status_code=200,
            json={"symbol": symbol, "price": prices.get(symbol, "100.00")},
            request=httpx.Request("GET", url)
        )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, side_effect=fake_get):
        response = client.get("/api/v1/crypto/tickers")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(SUPPORTED_CRYPTO_SYMBOLS)
    symbols_returned = {item["symbol"] for item in data}
    assert symbols_returned == {"BTCUSDT", "ETHUSDT", "SOLUSDT"}
    for item in data:
        assert item["price"] > 0
        assert item["quote_currency"] == "USDT"
        assert item["source"] == "binance_public_spot"
        assert "fetched_at" in item


def test_get_crypto_ticker_unsupported_symbol(client):
    response = client.get("/api/v1/crypto/ticker?symbol=DOGEUSDT")
    assert response.status_code == 400
    err = response.json()
    assert "Unsupported cryptocurrency symbol 'DOGEUSDT'" in err["detail"]
    assert "BTCUSDT" in err["detail"]


def test_get_crypto_ticker_missing_symbol(client):
    response = client.get("/api/v1/crypto/ticker")
    assert response.status_code == 422  # FastAPI validation error


def test_get_crypto_ticker_upstream_timeout(client):
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()


def test_get_crypto_ticker_upstream_connection_error(client):
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, side_effect=httpx.RequestError("Connection refused")):
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 502
    assert "unable to connect" in response.json()["detail"].lower()


def test_get_crypto_ticker_upstream_http_error(client):
    mock_resp = httpx.Response(
        status_code=500,
        content=b"Internal Server Error",
        request=httpx.Request("GET", "https://data-api.binance.vision/api/v3/ticker/price")
    )
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 502
    assert "error status" in response.json()["detail"].lower()


def test_get_crypto_ticker_malformed_payload(client):
    mock_resp = httpx.Response(
        status_code=200,
        json={"symbol": "BTCUSDT", "price": "invalid_non_numeric"},
        request=httpx.Request("GET", "https://data-api.binance.vision/api/v3/ticker/price")
    )
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 502
    assert "invalid price value" in response.json()["detail"].lower()


def test_get_crypto_ticker_negative_price_rejected(client):
    mock_resp = httpx.Response(
        status_code=200,
        json={"symbol": "BTCUSDT", "price": "-100.50"},
        request=httpx.Request("GET", "https://data-api.binance.vision/api/v3/ticker/price")
    )
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock, return_value=mock_resp):
        response = client.get("/api/v1/crypto/ticker?symbol=BTCUSDT")

    assert response.status_code == 502
    assert "invalid price value" in response.json()["detail"].lower()

