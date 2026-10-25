from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, Account, User, Asset
from app.schemas import OrderCreate, OrderOut
from app.dependencies import get_current_user, get_current_account
from app.services.order_engine import execute_order_transaction, cancel_pending_order

router = APIRouter(tags=["Orders"])

def _format_order(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        user_id=order.user_id,
        account_id=order.account_id,
        asset_id=order.asset_id,
        asset_symbol=order.asset.symbol if order.asset else None,
        asset_name=order.asset.name if order.asset else None,
        side=order.side,
        order_type=order.order_type,
        quantity=order.quantity,
        limit_price=order.limit_price,
        filled_quantity=order.filled_quantity,
        average_fill_price=order.average_fill_price,
        fees_paid=order.fees_paid,
        status=order.status,
        rejection_reason=order.rejection_reason,
        idempotency_key=order.idempotency_key,
        created_at=order.created_at,
        updated_at=order.updated_at,
        executions=order.executions,
    )

@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def submit_order(
    req: OrderCreate,
    current_user: User = Depends(get_current_user),
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    order = execute_order_transaction(
        db=db,
        account_id=current_account.id,
        user_id=current_user.id,
        asset_id=req.asset_id,
        side=req.side,
        order_type=req.order_type,
        quantity=req.quantity,
        limit_price=req.limit_price,
        idempotency_key=req.idempotency_key
    )
    return _format_order(order)

@router.get("/orders", response_model=List[OrderOut])
def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=100),
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    q = db.query(Order).join(Asset).filter(Order.account_id == current_account.id)
    if status_filter:
        q = q.filter(Order.status == status_filter.upper())
    orders = q.order_by(Order.created_at.desc()).limit(limit).all()
    return [_format_order(o) for o in orders]

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    order = db.query(Order).join(Asset).filter(
        Order.id == order_id,
        Order.account_id == current_account.id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return _format_order(order)

@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    current_account: Account = Depends(get_current_account),
    db: Session = Depends(get_db)
):
    order = cancel_pending_order(db=db, account_id=current_account.id, order_id=order_id)
    return _format_order(order)

