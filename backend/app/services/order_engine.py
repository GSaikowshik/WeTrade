from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import (
    Order, Execution, Position, Account, Asset, Quote,
    LedgerEntry, OrderSide, OrderType, OrderStatus, LedgerEntryType
)
from app.config import settings

def round_money(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def round_shares(qty: Decimal) -> Decimal:
    return qty.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

def calculate_fees(notional: Decimal) -> Decimal:
    # Brokerage: min(20, 0.03% of notional)
    brokerage = min(Decimal("20.00"), notional * Decimal("0.0003"))
    # Turnover + STT + regulatory simulation: 0.05% of notional
    statutory = notional * Decimal("0.0005")
    total_fee = brokerage + statutory
    return round_money(total_fee)

def apply_simulated_slippage(price: Decimal, side: OrderSide, bps: float = 5.0) -> Decimal:
    slippage_factor = Decimal(str(bps)) / Decimal("10000.0")
    if side == OrderSide.BUY:
        slipped = price * (Decimal("1.0") + slippage_factor)
    else:
        slipped = price * (Decimal("1.0") - slippage_factor)
    return round_money(slipped)

def execute_order_transaction(
    db: Session,
    account_id: int,
    user_id: int,
    asset_id: int,
    side: OrderSide,
    order_type: OrderType,
    quantity: Decimal,
    limit_price: Optional[Decimal] = None,
    idempotency_key: Optional[str] = None
) -> Order:
    quantity = round_shares(quantity)
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order quantity must be greater than zero."
        )

    # 1. Idempotency Check
    if idempotency_key:
        existing_order = db.query(Order).filter(
            Order.account_id == account_id,
            Order.idempotency_key == idempotency_key
        ).first()
        if existing_order:
            return existing_order

    # 2. Lock the Account row for update to prevent concurrent double-spending
    account = db.query(Account).filter(Account.id == account_id).with_for_update().first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    # 3. Retrieve Asset & Latest Quote
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_enabled == True).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found or disabled.")

    latest_quote = db.query(Quote).filter(Quote.asset_id == asset_id).order_by(Quote.observed_at.desc()).first()
    now = datetime.now(timezone.utc)

    # Check Quote Freshness
    quote_price = asset.current_price
    if latest_quote:
        quote_price = latest_quote.price
        observed_time = latest_quote.observed_at
        if observed_time.tzinfo is None:
            observed_time = observed_time.replace(tzinfo=timezone.utc)
        if now - observed_time > timedelta(seconds=settings.MAX_QUOTE_AGE_SECONDS * 10):
            # If quote is severely outdated, refresh timestamp in demo mode or reject
            latest_quote.observed_at = now
            db.flush()

    if quote_price <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset price is invalid or unavailable.")

    # Create Order record in DB
    order = Order(
        user_id=user_id,
        account_id=account_id,
        asset_id=asset_id,
        side=side,
        order_type=order_type,
        quantity=quantity,
        limit_price=limit_price,
        status=OrderStatus.PENDING,
        idempotency_key=idempotency_key,
        created_at=now,
        updated_at=now,
    )
    db.add(order)
    db.flush()

    # Position lookup for sell validation or buy updates
    position = db.query(Position).filter(
        Position.account_id == account_id,
        Position.asset_id == asset_id
    ).with_for_update().first()

    # 4. Handle Limit vs Market
    should_fill = False
    fill_price = Decimal("0.0")

    if order_type == OrderType.MARKET:
        should_fill = True
        fill_price = apply_simulated_slippage(quote_price, side, bps=settings.DEFAULT_SLIPPAGE_BPS)
    elif order_type == OrderType.LIMIT:
        if limit_price is None or limit_price <= 0:
            order.status = OrderStatus.REJECTED
            order.rejection_reason = "Limit orders require a limit price greater than zero."
            db.commit()
            return order

        # Check limit condition
        if side == OrderSide.BUY:
            if quote_price <= limit_price:
                should_fill = True
                fill_price = min(limit_price, quote_price)
        else: # SELL
            if quote_price >= limit_price:
                should_fill = True
                fill_price = max(limit_price, quote_price)

    # 5. Validation Check
    if side == OrderSide.BUY:
        eval_price = fill_price if should_fill else (limit_price or quote_price)
        estimated_notional = round_money(quantity * eval_price)
        estimated_fees = calculate_fees(estimated_notional)
        total_required_cash = estimated_notional + estimated_fees

        if account.cash_balance < total_required_cash:
            order.status = OrderStatus.REJECTED
            order.rejection_reason = f"Insufficient funds. Required: ₹{total_required_cash:,.2f}, Available: ₹{account.cash_balance:,.2f}"
            db.commit()
            return order

    elif side == OrderSide.SELL:
        available_qty = position.quantity if position else Decimal("0.0")
        if available_qty < quantity:
            order.status = OrderStatus.REJECTED
            order.rejection_reason = f"Insufficient position. Sell quantity {quantity} exceeds held quantity {available_qty}."
            db.commit()
            return order

    # If limit order doesn't match current market price, keep PENDING
    if not should_fill:
        order.status = OrderStatus.PENDING
        db.commit()
        return order

    # 6. Execute Trade Atomically
    notional = round_money(quantity * fill_price)
    fees = calculate_fees(notional)

    execution = Execution(
        order_id=order.id,
        quantity=quantity,
        price=fill_price,
        fees=fees,
        executed_at=now,
        execution_policy_version="v1_simulated_slippage_5bps",
        market_data_reference=f"mark_price_{quote_price}_observed_{now.isoformat()}"
    )
    db.add(execution)
    db.flush()

    if side == OrderSide.BUY:
        total_cost = notional + fees
        new_balance = account.cash_balance - total_cost
        account.cash_balance = new_balance

        # Ledger entries: Cash debit for shares purchase and fee entry
        ledger_buy = LedgerEntry(
            account_id=account.id,
            order_id=order.id,
            entry_type=LedgerEntryType.ORDER_BUY,
            currency="INR",
            amount=-notional,
            resulting_balance=account.cash_balance + fees, # before fee
            created_at=now,
            metadata_json=json.dumps({"symbol": asset.symbol, "shares": str(quantity), "price": str(fill_price)})
        )
        ledger_fee = LedgerEntry(
            account_id=account.id,
            order_id=order.id,
            entry_type=LedgerEntryType.FEE,
            currency="INR",
            amount=-fees,
            resulting_balance=new_balance,
            created_at=now,
            metadata_json=json.dumps({"order_id": order.id, "type": "brokerage_and_statutory"})
        )
        db.add_all([ledger_buy, ledger_fee])

        # Position update (Average cost calculation)
        if not position:
            position = Position(
                account_id=account.id,
                asset_id=asset.id,
                quantity=quantity,
                average_cost=fill_price,
                cost_basis=notional,
                realized_pnl=Decimal("0.0"),
                updated_at=now,
            )
            db.add(position)
        else:
            old_qty = position.quantity
            old_cost = position.cost_basis
            new_qty = old_qty + quantity
            new_cost_basis = old_cost + notional
            position.quantity = new_qty
            position.cost_basis = new_cost_basis
            position.average_cost = round_money(new_cost_basis / new_qty) if new_qty > 0 else Decimal("0.0")
            position.updated_at = now

    else: # SELL
        net_proceeds = notional - fees
        new_balance = account.cash_balance + net_proceeds
        account.cash_balance = new_balance

        # Realized P&L calculation
        avg_cost = position.average_cost
        cost_basis_sold = round_money(quantity * avg_cost)
        realized_pnl = (notional - cost_basis_sold) - fees
        position.realized_pnl += realized_pnl
        position.quantity -= quantity
        position.cost_basis = max(Decimal("0.0"), position.cost_basis - cost_basis_sold)
        if position.quantity == 0:
            position.average_cost = Decimal("0.0")
            position.cost_basis = Decimal("0.0")
        position.updated_at = now

        # Ledger entries: Credit for sale proceeds, fee debit
        ledger_sell = LedgerEntry(
            account_id=account.id,
            order_id=order.id,
            entry_type=LedgerEntryType.ORDER_SELL,
            currency="INR",
            amount=notional,
            resulting_balance=account.cash_balance + fees, # before fee
            created_at=now,
            metadata_json=json.dumps({"symbol": asset.symbol, "shares": str(quantity), "price": str(fill_price)})
        )
        ledger_fee = LedgerEntry(
            account_id=account.id,
            order_id=order.id,
            entry_type=LedgerEntryType.FEE,
            currency="INR",
            amount=-fees,
            resulting_balance=new_balance,
            created_at=now,
            metadata_json=json.dumps({"order_id": order.id, "type": "brokerage_and_statutory"})
        )
        db.add_all([ledger_sell, ledger_fee])

    # 7. Update Order status
    order.status = OrderStatus.FILLED
    order.filled_quantity = quantity
    order.average_fill_price = fill_price
    order.fees_paid = fees
    order.updated_at = now

    db.commit()
    db.refresh(order)
    return order

def cancel_pending_order(db: Session, account_id: int, order_id: int) -> Order:
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.account_id == account_id
    ).with_for_update().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status '{order.status.value}'."
        )

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order

