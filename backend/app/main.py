import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse, JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_demo_market_data

# Import routers
from app.routers import (
    health,
    auth,
    assets,
    orders,
    portfolio,
    journal,
    crypto
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure demo assets exist
    db = SessionLocal()
    try:
        seed_demo_market_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "We Trade API — A virtual trading and market-learning platform for Indian equities. "
        "Strictly simulated virtual funds and execution. Not a real brokerage or exchange."
    ),
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all versioned routers under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(journal.router, prefix=settings.API_V1_STR)
app.include_router(crypto.router, prefix=settings.API_V1_STR)

# Mount static frontend build if present
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(request: Request, full_path: str = ""):
        if full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            return None
        if full_path == "" and "text/html" not in request.headers.get("accept", ""):
            return JSONResponse({
                "message": "Welcome to We Trade API",
                "docs_url": "/docs",
                "version": settings.VERSION,
                "disclaimer": "All funds and transactions are virtual."
            })
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to We Trade API",
            "docs_url": "/docs",
            "version": settings.VERSION,
            "disclaimer": "All funds and transactions are virtual."
        }

