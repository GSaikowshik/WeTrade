from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Position, Account, Asset, Order, Execution
from app.schemas import PositionOut, PortfolioSummaryOut

def round_money(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def get_portfolio_summary(db: Session, account: Account) -> PortfolioSummaryOut:
    positions = db.query(Position).join(Asset).filter(
        Position.account_id == account.id,
        Position.quantity > 0
    ).all()

    position_outs = []
    total_market_val = Decimal("0.0")
    total_cost_basis = Decimal("0.0")
    total_unrealized = Decimal("0.0")

    for p in positions:
        curr_price = p.asset.current_price
        mkt_val = round_money(p.quantity * curr_price)
        unrealized = round_money(mkt_val - p.cost_basis)
        unrealized_pct = Decimal("0.0")
        if p.average_cost > 0:
            unrealized_pct = round_money(((curr_price - p.average_cost) / p.average_cost) * Decimal("100.0"))

        total_market_val += mkt_val
        total_cost_basis += p.cost_basis
        total_unrealized += unrealized

        position_outs.append(
            PositionOut(
                id=p.id,
                asset_id=p.asset_id,
                symbol=p.asset.symbol,
                name=p.asset.name,
                exchange=p.asset.exchange,
                quantity=p.quantity,
                average_cost=p.average_cost,
                cost_basis=p.cost_basis,
                current_price=curr_price,
                market_value=mkt_val,
                unrealized_pnl=unrealized,
                unrealized_return_pct=unrealized_pct,
                realized_pnl=round_money(p.realized_pnl),
            )
        )

    # Realized P&L across all positions (including closed ones)
    realized_agg = db.query(func.coalesce(func.sum(Position.realized_pnl), 0)).filter(
        Position.account_id == account.id
    ).scalar()
    total_realized_pnl = round_money(Decimal(str(realized_agg)))

    # Total fees paid
    fees_agg = db.query(func.coalesce(func.sum(Execution.fees), 0)).join(Order).filter(
        Order.account_id == account.id
    ).scalar()
    total_fees = round_money(Decimal(str(fees_agg)))

    cash = round_money(account.cash_balance)
    total_val = round_money(cash + total_market_val)

    total_unrealized_pct = Decimal("0.0")
    if total_cost_basis > 0:
        total_unrealized_pct = round_money((total_unrealized / total_cost_basis) * Decimal("100.0"))

    # Asset allocations
    allocations = []
    if total_val > 0:
        cash_pct = round_money((cash / total_val) * Decimal("100.0"))
        allocations.append({
            "symbol": "Cash (INR)",
            "name": "Virtual Cash",
            "market_value": float(cash),
            "percentage": float(cash_pct)
        })
        for p_out in position_outs:
            pct = round_money((Decimal(str(p_out.market_value)) / total_val) * Decimal("100.0"))
            allocations.append({
                "symbol": p_out.symbol,
                "name": p_out.name,
                "market_value": float(p_out.market_value),
                "percentage": float(pct)
            })

    return PortfolioSummaryOut(
        total_portfolio_value=total_val,
        available_cash=cash,
        total_market_value=round_money(total_market_val),
        total_unrealized_pnl=round_money(total_unrealized),
        total_unrealized_return_pct=total_unrealized_pct,
        total_realized_pnl=total_realized_pnl,
        total_fees_paid=total_fees,
        currency="INR",
        positions=position_outs,
        allocations=allocations
    )

