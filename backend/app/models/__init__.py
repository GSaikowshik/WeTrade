from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey,
    Numeric, Text, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class LedgerEntryType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    ORDER_BUY = "ORDER_BUY"
    ORDER_SELL = "ORDER_SELL"
    FEE = "FEE"
    REVERSAL = "REVERSAL"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    watchlist = relationship("WatchlistItem", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    base_currency = Column(String(10), default="INR", nullable=False)
    cash_balance = Column(Numeric(18, 4), default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="accounts")
    ledger_entries = relationship("LedgerEntry", back_populates="account", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="account", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="account", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), default="equity", nullable=False)
    market = Column(String(50), default="IN", nullable=False)
    exchange = Column(String(50), default="NSE", nullable=False)
    quote_currency = Column(String(10), default="INR", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    current_price = Column(Numeric(18, 4), default=0.0, nullable=False)
    change_24h = Column(Numeric(8, 4), default=0.0, nullable=False)
    high_24h = Column(Numeric(18, 4), default=0.0, nullable=False)
    low_24h = Column(Numeric(18, 4), default=0.0, nullable=False)
    volume_24h = Column(Numeric(20, 2), default=0.0, nullable=False)
    data_status = Column(String(50), default="demo", nullable=False)
    last_updated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "exchange", name="uq_asset_symbol_exchange"),
    )

    quotes = relationship("Quote", back_populates="asset", cascade="all, delete-orphan")
    bars = relationship("Bar", back_populates="asset", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="asset")
    orders = relationship("Order", back_populates="asset")

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Numeric(18, 4), nullable=False)
    bid = Column(Numeric(18, 4), nullable=True)
    ask = Column(Numeric(18, 4), nullable=True)
    source = Column(String(100), default="demo_seed", nullable=False)
    data_status = Column(String(50), default="demo", nullable=False)
    observed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    received_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    asset = relationship("Asset", back_populates="quotes")

class Bar(Base):
    __tablename__ = "bars"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    interval = Column(String(20), default="1D", nullable=False)
    open = Column(Numeric(18, 4), nullable=False)
    high = Column(Numeric(18, 4), nullable=False)
    low = Column(Numeric(18, 4), nullable=False)
    close = Column(Numeric(18, 4), nullable=False)
    volume = Column(Numeric(20, 2), default=0.0, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    asset = relationship("Asset", back_populates="bars")

    __table_args__ = (
        Index("idx_bars_asset_interval_timestamp", "asset_id", "interval", "timestamp"),
    )

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    side = Column(SQLEnum(OrderSide), nullable=False)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    quantity = Column(Numeric(18, 4), nullable=False)
    limit_price = Column(Numeric(18, 4), nullable=True)
    filled_quantity = Column(Numeric(18, 4), default=0.0, nullable=False)
    average_fill_price = Column(Numeric(18, 4), nullable=True)
    fees_paid = Column(Numeric(18, 4), default=0.0, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=True)
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="orders")
    account = relationship("Account", back_populates="orders")
    asset = relationship("Asset", back_populates="orders")
    executions = relationship("Execution", back_populates="order", cascade="all, delete-orphan")

class Execution(Base):
    __tablename__ = "executions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Numeric(18, 4), nullable=False)
    price = Column(Numeric(18, 4), nullable=False)
    fees = Column(Numeric(18, 4), default=0.0, nullable=False)
    executed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    execution_policy_version = Column(String(50), default="v1_simulated_slippage_5bps", nullable=False)
    market_data_reference = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="executions")

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    entry_type = Column(SQLEnum(LedgerEntryType), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)  # positive for credits, negative for debits
    resulting_balance = Column(Numeric(18, 4), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    metadata_json = Column(Text, nullable=True)

    account = relationship("Account", back_populates="ledger_entries")

class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    quantity = Column(Numeric(18, 4), default=0.0, nullable=False)
    average_cost = Column(Numeric(18, 4), default=0.0, nullable=False)
    cost_basis = Column(Numeric(18, 4), default=0.0, nullable=False)
    realized_pnl = Column(Numeric(18, 4), default=0.0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    account = relationship("Account", back_populates="positions")
    asset = relationship("Asset", back_populates="positions")

    __table_args__ = (
        UniqueConstraint("account_id", "asset_id", name="uq_position_account_asset"),
    )

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="watchlist")
    asset = relationship("Asset")

    __table_args__ = (
        UniqueConstraint("user_id", "asset_id", name="uq_watchlist_user_asset"),
    )

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    thesis = Column(Text, nullable=False)
    planned_entry = Column(Numeric(18, 4), nullable=True)
    planned_stop = Column(Numeric(18, 4), nullable=True)
    planned_target = Column(Numeric(18, 4), nullable=True)
    exit_reason = Column(Text, nullable=True)
    lesson_learned = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="journal_entries")
    order = relationship("Order")
    asset = relationship("Asset")

