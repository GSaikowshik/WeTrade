from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
from sqlalchemy.orm import Session
from app.models import Asset, Quote, Bar
from app.database import SessionLocal

DEMO_ASSETS = [
    {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("2945.50"),
        "change_24h": Decimal("1.25"),
        "high_24h": Decimal("2968.00"),
        "low_24h": Decimal("2912.10"),
        "volume_24h": Decimal("4821000.0"),
    },
    {
        "symbol": "TCS",
        "name": "Tata Consultancy Services Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("3820.00"),
        "change_24h": Decimal("-0.65"),
        "high_24h": Decimal("3855.00"),
        "low_24h": Decimal("3802.50"),
        "volume_24h": Decimal("2154000.0"),
    },
    {
        "symbol": "INFY",
        "name": "Infosys Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("1884.25"),
        "change_24h": Decimal("2.10"),
        "high_24h": Decimal("1898.00"),
        "low_24h": Decimal("1850.00"),
        "volume_24h": Decimal("6432000.0"),
    },
    {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("1678.80"),
        "change_24h": Decimal("0.45"),
        "high_24h": Decimal("1692.00"),
        "low_24h": Decimal("1665.50"),
        "volume_24h": Decimal("8912000.0"),
    },
    {
        "symbol": "ICICIBANK",
        "name": "ICICI Bank Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("1242.15"),
        "change_24h": Decimal("1.80"),
        "high_24h": Decimal("1254.00"),
        "low_24h": Decimal("1228.00"),
        "volume_24h": Decimal("7540000.0"),
    },
    {
        "symbol": "ITC",
        "name": "ITC Limited",
        "exchange": "NSE",
        "market": "IN",
        "quote_currency": "INR",
        "asset_type": "equity",
        "base_price": Decimal("492.30"),
        "change_24h": Decimal("-0.30"),
        "high_24h": Decimal("496.80"),
        "low_24h": Decimal("489.20"),
        "volume_24h": Decimal("12450000.0"),
    },
]

def seed_demo_market_data(db: Session):
    now = datetime.now(timezone.utc)
    
    for item in DEMO_ASSETS:
        existing = db.query(Asset).filter(
            Asset.symbol == item["symbol"],
            Asset.exchange == item["exchange"]
        ).first()
        
        if existing:
            # Update price and timestamp
            existing.current_price = item["base_price"]
            existing.last_updated_at = now
            asset = existing
        else:
            asset = Asset(
                symbol=item["symbol"],
                name=item["name"],
                exchange=item["exchange"],
                market=item["market"],
                quote_currency=item["quote_currency"],
                asset_type=item["asset_type"],
                current_price=item["base_price"],
                change_24h=item["change_24h"],
                high_24h=item["high_24h"],
                low_24h=item["low_24h"],
                volume_24h=item["volume_24h"],
                data_status="demo",
                is_enabled=True,
                last_updated_at=now,
            )
            db.add(asset)
            db.flush()

        # Seed latest quote
        spread = item["base_price"] * Decimal("0.0005")
        quote = Quote(
            asset_id=asset.id,
            price=item["base_price"],
            bid=item["base_price"] - spread,
            ask=item["base_price"] + spread,
            source="demo_seed",
            data_status="demo",
            observed_at=now,
            received_at=now,
        )
        db.add(quote)

        # Generate 30 daily bars if none exist
        bar_count = db.query(Bar).filter(Bar.asset_id == asset.id).count()
        if bar_count == 0:
            random.seed(hash(item["symbol"]))
            curr = float(item["base_price"])
            bars = []
            for d in range(30, 0, -1):
                bar_time = now - timedelta(days=d)
                delta_pct = random.uniform(-0.02, 0.025)
                open_p = curr * (1 + delta_pct)
                high_p = open_p * (1 + random.uniform(0.005, 0.02))
                low_p = open_p * (1 - random.uniform(0.005, 0.02))
                close_p = random.uniform(low_p, high_p)
                vol = random.uniform(1000000, 10000000)
                curr = close_p
                bars.append(
                    Bar(
                        asset_id=asset.id,
                        interval="1D",
                        open=Decimal(f"{open_p:.2f}"),
                        high=Decimal(f"{high_p:.2f}"),
                        low=Decimal(f"{low_p:.2f}"),
                        close=Decimal(f"{close_p:.2f}"),
                        volume=Decimal(f"{vol:.0f}"),
                        timestamp=bar_time,
                    )
                )
            # Add latest bar for today
            bars.append(
                Bar(
                    asset_id=asset.id,
                    interval="1D",
                    open=item["low_24h"],
                    high=item["high_24h"],
                    low=item["low_24h"],
                    close=item["base_price"],
                    volume=item["volume_24h"],
                    timestamp=now,
                )
            )
            db.add_all(bars)

    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_demo_market_data(db)
        print("Successfully seeded demo market data!")
    finally:
        db.close()

