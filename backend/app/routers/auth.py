from decimal import Decimal
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Account, LedgerEntry, LedgerEntryType
from app.schemas import UserRegister, UserLogin, Token, UserOut
from app.services.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(tags=["Authentication"])

@router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check existing email
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create user
    user = User(
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        status="active"
    )
    db.add(user)
    db.flush()

    # Create virtual wallet account with ₹100,000 initial starting capital
    starting_balance = Decimal(str(settings.STARTING_BALANCE_INR))
    account = Account(
        user_id=user.id,
        base_currency=settings.BASE_CURRENCY,
        cash_balance=starting_balance
    )
    db.add(account)
    db.flush()

    # Record the initial deposit into the immutable ledger
    deposit_entry = LedgerEntry(
        account_id=account.id,
        entry_type=LedgerEntryType.DEPOSIT,
        currency=settings.BASE_CURRENCY,
        amount=starting_balance,
        resulting_balance=starting_balance,
        metadata_json=json.dumps({"description": "Initial virtual trading starting balance grant"})
    )
    db.add(deposit_entry)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )

@router.post("/auth/login", response_model=Token)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended."
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )

@router.get("/users/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

