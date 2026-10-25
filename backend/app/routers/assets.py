from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Asset, Quote, Bar, WatchlistItem, User
from app.schemas import AssetOut, QuoteOut, BarOut, WatchlistAdd, WatchlistOut
from app.dependencies import get_current_user

router = APIRouter(tags=["Assets & Watchlist"])

@router.get("/assets", response_model=List[AssetOut])
def list_assets(
    query: Optional[str] = Query(None, description="Search by symbol or company name"),
    exchange: Optional[str] = Query(None, description="Filter by exchange (e.g. NSE)"),
    db: Session = Depends(get_db)
):
    q = db.query(Asset).filter(Asset.is_enabled == True)
    if query:
        search = f"%{query.strip()}%"
        q = q.filter(or_(Asset.symbol.ilike(search), Asset.name.ilike(search)))
    if exchange:
        q = q.filter(Asset.exchange.ilike(exchange.strip()))
    return q.order_by(Asset.symbol.asc()).all()

@router.get("/assets/{asset_id}", response_model=AssetOut)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_enabled == True).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    return asset

@router.get("/assets/{asset_id}/quotes", response_model=List[QuoteOut])
def get_asset_quotes(asset_id: int, limit: int = 20, db: Session = Depends(get_db)):
    quotes = db.query(Quote).filter(Quote.asset_id == asset_id).order_by(Quote.observed_at.desc()).limit(limit).all()
    return quotes

@router.get("/assets/{asset_id}/bars", response_model=List[BarOut])
def get_asset_bars(
    asset_id: int,
    interval: str = Query("1D", pattern="^(1D|1H|15m)$"),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    bars = db.query(Bar).filter(
        Bar.asset_id == asset_id,
        Bar.interval == interval
    ).order_by(Bar.timestamp.asc()).limit(limit).all()
    return bars

@router.get("/watchlist", response_model=List[WatchlistOut])
def get_user_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(WatchlistItem).join(Asset).filter(
        WatchlistItem.user_id == current_user.id
    ).order_by(WatchlistItem.created_at.desc()).all()
    return items

@router.post("/watchlist", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    req: WatchlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.asset_id == req.asset_id
    ).first()
    if existing:
        return existing

    item = WatchlistItem(user_id=current_user.id, asset_id=req.asset_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/watchlist/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.asset_id == asset_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return None
