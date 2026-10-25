from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models import OrderSide, OrderType, OrderStatus, LedgerEntryType

# Auth & User
class UserRegister(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Assets & Market Data
class AssetOut(BaseModel):
    id: int
    symbol: str
    name: str
    asset_type: str
    market: str
    exchange: str
    quote_currency: str
    current_price: float
    change_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    data_status: str
    last_updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QuoteOut(BaseModel):
    id: int
    asset_id: int
    price: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    source: str
    data_status: str
    observed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BarOut(BaseModel):
    interval: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class WatchlistAdd(BaseModel):
    asset_id: int

class WatchlistOut(BaseModel):
    id: int
    asset_id: int
    asset: AssetOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Orders
class OrderCreate(BaseModel):
    asset_id: int
    side: OrderSide
    order_type: OrderType
    quantity: Decimal = Field(..., gt=0)
    limit_price: Optional[Decimal] = Field(None, gt=0)
    idempotency_key: Optional[str] = None

class ExecutionOut(BaseModel):
    id: int
    order_id: int
    quantity: float
    price: float
    fees: float
    executed_at: datetime
    execution_policy_version: str
    market_data_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    asset_id: int
    asset_symbol: Optional[str] = None
    asset_name: Optional[str] = None
    side: OrderSide
    order_type: OrderType
    quantity: float
    limit_price: Optional[float] = None
    filled_quantity: float
    average_fill_price: Optional[float] = None
    fees_paid: float
    status: OrderStatus
    rejection_reason: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    executions: List[ExecutionOut] = []

    model_config = ConfigDict(from_attributes=True)

# Ledger & Account
class LedgerEntryOut(BaseModel):
    id: int
    account_id: int
    order_id: Optional[int] = None
    entry_type: LedgerEntryType
    currency: str
    amount: float
    resulting_balance: float
    created_at: datetime
    metadata_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AccountOut(BaseModel):
    id: int
    user_id: int
    base_currency: str
    cash_balance: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Positions & Portfolio
class PositionOut(BaseModel):
    id: int
    asset_id: int
    symbol: str
    name: str
    exchange: str
    quantity: float
    average_cost: float
    cost_basis: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_return_pct: float
    realized_pnl: float

class PortfolioSummaryOut(BaseModel):
    total_portfolio_value: float
    available_cash: float
    total_market_value: float
    total_unrealized_pnl: float
    total_unrealized_return_pct: float
    total_realized_pnl: float
    total_fees_paid: float
    currency: str = "INR"
    positions: List[PositionOut]
    allocations: List[dict]

# Trade Journal
class JournalCreate(BaseModel):
    order_id: Optional[int] = None
    asset_id: Optional[int] = None
    thesis: str = Field(..., min_length=3)
    planned_entry: Optional[Decimal] = None
    planned_stop: Optional[Decimal] = None
    planned_target: Optional[Decimal] = None
    exit_reason: Optional[str] = None
    lesson_learned: Optional[str] = None

class JournalUpdate(BaseModel):
    thesis: Optional[str] = None
    planned_entry: Optional[Decimal] = None
    planned_stop: Optional[Decimal] = None
    planned_target: Optional[Decimal] = None
    exit_reason: Optional[str] = None
    lesson_learned: Optional[str] = None

class JournalOut(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    asset_id: Optional[int] = None
    asset_symbol: Optional[str] = None
    thesis: str
    planned_entry: Optional[float] = None
    planned_stop: Optional[float] = None
    planned_target: Optional[float] = None
    exit_reason: Optional[str] = None
    lesson_learned: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Analytics
class AnalyticsSummaryOut(BaseModel):
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate_pct: float
    total_realized_pnl: float
    total_fees_paid: float
    net_pnl: float
    largest_win: float
    largest_loss: float
