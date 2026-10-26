import asyncio
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import math
from typing import List, Optional
import httpx
from fastapi import HTTPException, status
from app.schemas import CryptoTickerOut

BINANCE_PRICE_URL = "https://data-api.binance.vision/api/v3/ticker/price"
DEFAULT_TIMEOUT_SECONDS = 5.0

# Supported cryptocurrency trading pairs
SUPPORTED_CRYPTO_SYMBOLS = {
    "BTCUSDT": "USDT",
    "ETHUSDT": "USDT",
    "SOLUSDT": "USDT",
}

def validate_and_parse_price(raw_price: any) -> float:
    """
    Parses and strictly validates that price is a positive, finite decimal value.
    Rejects missing, zero, negative, malformed, or non-finite values.
    """
    if raw_price is None or raw_price == "":
        raise ValueError("Price is missing or empty")
    try:
        dec = Decimal(str(raw_price).strip())
        val = float(dec)
        if not math.isfinite(val) or dec <= 0:
            raise ValueError("Price must be a positive finite number")
        return val
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Invalid price value") from exc


class BinanceCryptoService:
    def __init__(self, base_url: str = BINANCE_PRICE_URL, timeout: float = DEFAULT_TIMEOUT_SECONDS):
        self.base_url = base_url
        self.timeout = timeout

    async def fetch_ticker(self, symbol: str, client: Optional[httpx.AsyncClient] = None) -> CryptoTickerOut:
        """
        Fetches the latest public spot ticker price for a single supported cryptocurrency pair.
        Normalizes upstream failures into structured HTTP exceptions.
        """
        norm_symbol = symbol.strip().upper() if symbol else ""
        if norm_symbol not in SUPPORTED_CRYPTO_SYMBOLS:
            supported = ", ".join(sorted(SUPPORTED_CRYPTO_SYMBOLS.keys()))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported cryptocurrency symbol '{symbol}'. Supported symbols: {supported}"
            )

        quote_currency = SUPPORTED_CRYPTO_SYMBOLS[norm_symbol]

        async def _do_request(c: httpx.AsyncClient) -> CryptoTickerOut:
            try:
                resp = await c.get(self.base_url, params={"symbol": norm_symbol})
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Upstream cryptocurrency market data request timed out."
                )
            except httpx.RequestError:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Unable to connect to upstream cryptocurrency market data provider."
                )

            # Record timestamp at the moment our backend receives the successful response
            fetch_timestamp = datetime.now(timezone.utc)

            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Upstream cryptocurrency market data provider returned an error status."
                )

            try:
                data = resp.json()
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Upstream provider returned an unparseable response payload."
                )

            if not isinstance(data, dict) or "price" not in data or "symbol" not in data:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Upstream provider returned a malformed ticker payload."
                )

            try:
                validated_price = validate_and_parse_price(data.get("price"))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Upstream provider returned an invalid price value."
                )

            return CryptoTickerOut(
                symbol=norm_symbol,
                price=validated_price,
                quote_currency=quote_currency,
                source="binance_public_spot",
                fetched_at=fetch_timestamp
            )

        if client is not None:
            return await _do_request(client)

        async with httpx.AsyncClient(timeout=self.timeout) as local_client:
            return await _do_request(local_client)

    async def fetch_all_supported_tickers(self) -> List[CryptoTickerOut]:
        """
        Concurrently fetches ticker prices for all supported cryptocurrency pairs
        using a shared HTTP client and asyncio.gather to avoid sequential latency.
        """
        symbols = sorted(SUPPORTED_CRYPTO_SYMBOLS.keys())
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            tasks = [self.fetch_ticker(sym, client=client) for sym in symbols]
            results = await asyncio.gather(*tasks)
            return list(results)


crypto_service = BinanceCryptoService()

