<<<<<<< HEAD
# WeTrade
=======
# We Trade — Virtual Trading & Market-Learning Platform

> **Practise the markets. Understand your decisions. Improve without risking real money.**

We Trade is a full-stack educational trading simulator designed to help beginner and intermediate traders practise market mechanics, order execution, position sizing, and trade journaling for Indian equities without risking real capital.

---

## 1. Technical Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Vitest, React Testing Library
- **Backend:** Python 3.10+, FastAPI, Pydantic V2, SQLAlchemy 2.x, Alembic, PostgreSQL, PyJWT, bcrypt, pytest, HTTPX
- **Database:** PostgreSQL (with atomic transactions, `SELECT ... FOR UPDATE` row-level concurrency locking, and an append-only double-entry ledger)

---

## 2. Core Architecture & Simulation Invariants

1. **Virtual Starting Balance:** Every new user receives exactly **₹100,000.00** in virtual INR starting balance recorded in an append-only ledger on registration.
2. **Authoritative Backend:** The frontend never calculates balances, fees, or fills. All state transitions, affordability checks, and math are strictly enforced on the server.
3. **Double-Entry Append-Only Ledger:** The `ledger_entries` table tracks every financial movement (`DEPOSIT`, `ORDER_BUY`, `ORDER_SELL`, `FEE`). Past financial history is never mutated.
4. **Concurrency & Overspending Prevention:** Account balances use `SELECT ... FOR UPDATE` row locks within atomic database transactions, preventing race conditions or double-spending.
5. **Idempotency Protection:** Order requests support an `idempotency_key`. Retrying duplicate requests returns the existing order safely without duplicate fills.
6. **Execution Policy:**
   - **Market Orders:** Immediate simulated execution against mark price with a 0.05% (5 bps) slippage factor. Rejected if quote is older than 60 seconds (`MAX_QUOTE_AGE_SECONDS`).
   - **Limit Orders:** Stored in `PENDING` state and evaluated against market price. Cancellable while pending.
7. **Cost-Basis & P&L Formula:** Weighted average cost basis is maintained across partial fills and partial sales:
   $$\text{Realized P\&L} = (\text{Sell Price} - \text{Avg Cost Basis}) \times \text{Sold Qty} - \text{Sell Fees}$$

---

## 3. Repository Structure

```
WeTrade/
├── we_trade_prd.md             # Product Requirements Document (Source of truth)
├── README.md                   # Setup, architecture & running instructions
├── .env.example                # Template environment variables
├── docs/
│   └── ACCOUNTING_POLICY.md   # Documented accounting, fee & execution rules
├── backend/
│   ├── alembic.ini             # Alembic migration configuration
│   ├── requirements.txt        # Backend Python dependencies
│   ├── alembic/                # Migration scripts and schema history
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point, CORS & lifecycle
│   │   ├── config.py           # Application settings & environment variables
│   │   ├── database.py         # SQLAlchemy engine and session dependency
│   │   ├── dependencies.py     # JWT authentication & account resolvers
│   │   ├── models/             # SQLAlchemy ORM models (users, accounts, orders, ledger, etc.)
│   │   ├── schemas/            # Pydantic request/response validation schemas
│   │   ├── services/           # Order engine, portfolio analytics & demo data seeder
│   │   └── routers/            # Versioned API routes (/api/v1/...)
│   └── tests/                  # Automated pytest integration test suite
└── frontend/
    ├── package.json            # Node dependencies and scripts
    ├── vite.config.ts          # Vite configuration with API proxy
    ├── tailwind.config.js      # Fintech design tokens
    └── src/
        ├── App.tsx             # Root router and app state
        ├── api/client.ts       # Typed API client with token management
        ├── components/         # Reusable UI (Navbar, PriceChart, OrderTicket, AuthModal)
        ├── pages/              # Dashboard, Markets, Portfolio, OrdersHistory, Journal, Learn
        └── test/               # Vitest component test suite
```

---

## 4. Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+ running locally or in Docker

### Step 1: PostgreSQL Database Setup
You can run PostgreSQL locally or connect to **Supabase**:
- **Option A: Supabase (Managed Postgres):**
  1. Create a project in [Supabase](https://supabase.com).
  2. Copy your connection string from **Project Settings > Database > Connection string > URI**.
  3. In `.env`:
     ```bash
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
- **Option B: Local PostgreSQL:**
  ```bash
  createdb wetrade
  ```

### Step 2: Backend Setup & Migrations
1. Navigate to the backend directory and set up your environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Run Alembic migrations to create the schema:
```bash
alembic upgrade head
```

3. Seed the 6 Indian equity assets and historical candlestick bars:
```bash
python3 -m app.services.seed_data
```

4. Start the FastAPI development server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
```bash
cd frontend
npm install
```

2. Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Running Automated Tests

### Backend Tests (pytest)
Runs 18 comprehensive tests covering authentication, wallet grants, market orders, limit orders, fee calculations, oversell rejections, insufficient cash rejections, idempotency duplicate prevention, and cross-user authorization isolation:
```bash
# From workspace root:
PYTHONPATH=backend_packages:backend python3 -m pytest backend/tests -v
```

### Frontend Tests (Vitest)
Runs component tests for rendering, live form calculations, and order validations:
```bash
cd frontend
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 6. Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+psycopg://localhost/wetrade` | SQLAlchemy PostgreSQL connection URI |
| `SECRET_KEY` | `wetrade-dev-super-secret-key...` | HMAC-SHA256 signing secret for JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | JWT expiration time in minutes |
| `STARTING_BALANCE_INR` | `100000.0` | Initial virtual cash grant for new registrations |
| `BASE_CURRENCY` | `INR` | Default account currency |
| `MAX_QUOTE_AGE_SECONDS` | `60` | Stale quote execution cutoff |
| `DEFAULT_SLIPPAGE_BPS` | `5.0` (0.05%) | Simulated slippage for market orders |

---

## 7. Supported Universe (MVP)

The MVP initial release supports 6 high-liquidity Indian equities on the National Stock Exchange (NSE):
- `RELIANCE` — Reliance Industries Limited
- `TCS` — Tata Consultancy Services Limited
- `INFY` — Infosys Limited
- `HDFCBANK` — HDFC Bank Limited
- `ICICIBANK` — ICICI Bank Limited
- `ITC` — ITC Limited

---

## 8. Known Limitations & Deferred Work (MVP Scope)

Per the PRD (Section 3.2 & Section 23 item 10):
- **Real-Money Trading:** Strictly deferred. No real money, payment gateways, bank transfers, or live brokerage integrations exist in We Trade.
- **Derivatives & Leverage:** Options, futures, margin trading, and short selling are non-goals for the initial release.
- **Multi-Market (US / Crypto):** Indian equities only for the MVP. Multi-currency and FX conversion are slated for Release 3.
- **Historical Replay Mode:** Slated for Release 2.
- **AWS Infrastructure:** Explicitly deferred for local development and beta launch; no AWS services or Kafka/microservices are used.

>>>>>>> 7411cc6 (feat: initial release of We Trade virtual trading platform)
