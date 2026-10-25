import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.services.seed_data import seed_demo_market_data

# Use test database or shared local PostgreSQL
TEST_DATABASE_URL = "postgresql+psycopg://gandikotasaikowshik@/wetrade?host=/tmp"

test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_demo_market_data(db)
    finally:
        db.close()
    yield

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def user_a_auth(client):
    email = "trader_a@example.com"
    pwd = "securepassword123"
    # Register or login
    resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Trader Alice"
    })
    if resp.status_code == 400: # already exists
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "email": email}

@pytest.fixture
def user_b_auth(client):
    email = "trader_b@example.com"
    pwd = "securepassword456"
    resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Trader Bob"
    })
    if resp.status_code == 400:
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}", "email": email}

