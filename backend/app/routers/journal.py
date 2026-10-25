from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import JournalEntry, User, Account, Asset, Position, Execution, Order
from app.schemas import (
    JournalCreate, JournalUpdate, JournalOut, AnalyticsSummaryOut
)
from app.dependencies import get_current_user, get_current_account

router = APIRouter(tags=["Trade Journal & Analytics"])

def _format_journal(j: JournalEntry) -> JournalOut:
    return JournalOut(
        id=j.id,
        user_id=j.user_id,
        order_id=j.order_id,
        asset_id=j.asset_id,
        asset_symbol=j.asset.symbol if j.asset else None,
        thesis=j.thesis,
        planned_entry=j.planned_entry,
        planned_stop=j.planned_stop,
        planned_target=j.planned_target,
        exit_reason=j.exit_reason,
        lesson_learned=j.lesson_learned,
        created_at=j.created_at,
        updated_at=j.updated_at
    )

@router.get("/journal", response_model=List[JournalOut])
def list_journal_entries(
    asset_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(JournalEntry).outerjoin(Asset).filter(JournalEntry.user_id == current_user.id)
    if asset_id:
        q = q.filter(JournalEntry.asset_id == asset_id)
    entries = q.order_by(JournalEntry.created_at.desc()).limit(limit).all()
    return [_format_journal(e) for e in entries]

@router.post("/journal", response_model=JournalOut, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    req: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = JournalEntry(
        user_id=current_user.id,
        order_id=req.order_id,
        asset_id=req.asset_id,
        thesis=req.thesis,
        planned_entry=req.planned_entry,
        planned_stop=req.planned_stop,
        planned_target=req.planned_target,
        exit_reason=req.exit_reason,
        lesson_learned=req.lesson_learned,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _format_journal(entry)

@router.patch("/journal/{entry_id}", response_model=JournalOut)
def update_journal_entry(
    entry_id: int,
    req: JournalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")

    if req.thesis is not None:
        entry.thesis = req.thesis
    if req.planned_entry is not None:
        entry.planned_entry = req.planned_entry
    if req.planned_stop is not None:
        entry.planned_stop = req.planned_stop
    if req.planned_target is not None:
        entry.planned_target = req.planned_target
    if req.exit_reason is not None:
        entry.exit_reason = req.exit_reason
    if req.lesson_learned is not None:
        entry.lesson_learned = req.lesson_learned
    entry.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(entry)
    return _format_journal(entry)

@router.delete("/journal/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    if entry:
        db.delete(entry)
        db.commit()
    return None

@router.get("/analytics/summary", response_model=AnalyticsSummaryOut)
def get_analytics_summary(
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    # Retrieve all executions for this account
    filled_orders = db.query(Order).filter(
        Order.account_id == current_account.id,
        Order.status == "FILLED"
    ).all()
    total_trades = len(filled_orders)

    # Realized positions
    positions = db.query(Position).filter(Position.account_id == current_account.id).all()
    winning = 0
    losing = 0
    total_realized = Decimal("0.0")
    largest_win = Decimal("0.0")
    largest_loss = Decimal("0.0")

    for p in positions:
        r = p.realized_pnl
        total_realized += r
        if r > 0:
            winning += 1
            if r > largest_win:
                largest_win = r
        elif r < 0:
            losing += 1
            if r < largest_loss:
                largest_loss = r

    # Total fees paid
    fees_sum = db.query(func.coalesce(func.sum(Execution.fees), 0)).join(Order).filter(
        Order.account_id == current_account.id
    ).scalar()
    total_fees = Decimal(str(fees_sum))

    win_rate = Decimal("0.0")
    closed_count = winning + losing
    if closed_count > 0:
        win_rate = (Decimal(str(winning)) / Decimal(str(closed_count))) * Decimal("100.0")

    net_pnl = total_realized - total_fees

    return AnalyticsSummaryOut(
        total_trades=total_trades,
        winning_trades=winning,
        losing_trades=losing,
        win_rate_pct=win_rate.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_realized_pnl=total_realized.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_fees_paid=total_fees.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        net_pnl=net_pnl.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        largest_win=largest_win.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        largest_loss=largest_loss.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
    )

