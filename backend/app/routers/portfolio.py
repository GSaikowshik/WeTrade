from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Account, LedgerEntry, Execution, Order
from app.schemas import PortfolioSummaryOut, PositionOut, LedgerEntryOut, ExecutionOut
from app.dependencies import get_current_account
from app.services.portfolio import get_portfolio_summary

router = APIRouter(tags=["Portfolio, Ledger & Executions"])

@router.get("/portfolio", response_model=PortfolioSummaryOut)
def get_portfolio(
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    return get_portfolio_summary(db=db, account=current_account)

@router.get("/portfolio/positions", response_model=List[PositionOut])
def get_positions(
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    summary = get_portfolio_summary(db=db, account=current_account)
    return summary.positions

@router.get("/ledger", response_model=List[LedgerEntryOut])
def get_ledger(
    limit: int = Query(100, le=200),
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.account_id == current_account.id
    ).order_by(LedgerEntry.created_at.desc(), LedgerEntry.id.desc()).limit(limit).all()
    return entries

@router.get("/executions", response_model=List[ExecutionOut])
def get_executions(
    limit: int = Query(100, le=200),
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    executions = db.query(Execution).join(Order).filter(
        Order.account_id == current_account.id
    ).order_by(Execution.executed_at.desc()).limit(limit).all()
    return executions

