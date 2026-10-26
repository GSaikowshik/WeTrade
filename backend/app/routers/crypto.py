from typing import List
from fastapi import APIRouter, Query
from app.schemas import CryptoTickerOut
from app.services.crypto import crypto_service

router = APIRouter(prefix="/crypto", tags=["Cryptocurrency Market Data"])

@router.get(
    "/tickers",
    response_model=List[CryptoTickerOut],
    summary="Get All Supported Crypto Tickers",
    description="Concurrently fetches current spot market prices for all supported cryptocurrency pairs (BTCUSDT, ETHUSDT, SOLUSDT) from Binance public Spot API."
)
async def get_all_crypto_tickers() -> List[CryptoTickerOut]:
    return await crypto_service.fetch_all_supported_tickers()

@router.get(
    "/ticker",
    response_model=CryptoTickerOut,
    summary="Get Single Crypto Ticker",
    description="Fetches current spot market price for a specified supported cryptocurrency pair from Binance public Spot API."
)
async def get_crypto_ticker(
    symbol: str = Query(..., description="Cryptocurrency symbol (e.g. BTCUSDT, ETHUSDT, SOLUSDT)")
) -> CryptoTickerOut:
    return await crypto_service.fetch_ticker(symbol)

