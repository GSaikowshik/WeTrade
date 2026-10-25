# We Trade --- Product Requirements Document (PRD)

**Document status:** Initial product specification\
**Version:** 1.0\
**Product type:** Web-based virtual trading and market-learning
platform\
**Primary audience:** Beginner and intermediate market learners\
**Team:** Two developers\
**Initial deployment:** Local development, followed by a small online
beta\
**Cloud strategy:** AWS deferred until there is a concrete need

------------------------------------------------------------------------

## 1. Product Summary

We Trade is a web application where users can practise buying and
selling financial assets with virtual money. The interface should feel
like a polished modern fintech platform, while the product's
distinguishing value is helping users understand their decisions---not
merely displaying virtual profit and loss.

The first release will focus on a reliable paper-trading experience for
a limited set of Indian stocks. It will include a virtual wallet, market
watchlist, price charts, simulated orders, portfolio tracking, a trade
journal, and basic performance analytics.

The architecture should allow additional markets---such as US equities
and cryptocurrency---to be added later without rebuilding the core
application.

### Product positioning

> Practise the markets. Understand your decisions. Improve without
> risking real money.

### Core principle

Virtual money is simulated, but accounting, order validation,
transaction history, and portfolio calculations must be consistent,
auditable, and carefully tested. Market data and simulated execution
must be clearly distinguished.

------------------------------------------------------------------------

## 2. Problem Statement

New market participants often find it difficult to practise market
mechanics without risking real money. Existing charting and
paper-trading tools can help users simulate trades, but We Trade aims to
make the learning loop central to the experience.

Users should be able to: 1. Explore a supported asset and understand its
recent price movement. 2. Place a simulated order using virtual funds.
3. Track their position and portfolio. 4. Record the reasoning and risk
plan behind a trade. 5. Review the outcome, including costs and risk. 6.
Learn from their history and measure progress over time.

We Trade is an educational simulator, not a brokerage, exchange,
investment adviser, or promise of future trading performance.

------------------------------------------------------------------------

## 3. Goals and Non-Goals

### 3.1 MVP goals

-   Deliver a polished, responsive desktop-first web experience with
    mobile support.
-   Allow a user to create an account and receive a virtual starting
    balance.
-   Display supported market assets and properly timestamped prices.
-   Allow users to submit simulated market and limit orders.
-   Maintain correct virtual cash, positions, order states, fees, and
    P&L.
-   Show order and transaction history.
-   Let users keep a lightweight trade journal.
-   Show basic performance and risk metrics.
-   Provide clear explanations of simulation assumptions and data
    freshness.
-   Deploy a usable beta after local functionality and tests are
    reliable.

### 3.2 Non-goals for the MVP

Do not build these in the first release: - Real-money trading, deposits,
withdrawals, brokerage connections, or payments. - Options, futures,
margin, short selling, leverage, or complex derivatives. - Copy trading,
social feeds, messaging, or public leaderboards. - AI price predictions
or claims that a strategy will be profitable. - Automated trading
bots. - Full support for Indian stocks, US stocks, and crypto
simultaneously. - Microservices, Kubernetes, Kafka, or elaborate cloud
infrastructure. - A complex AI coach. Start with transparent, rule-based
educational feedback.

------------------------------------------------------------------------

## 4. Target Users and User Stories

### Primary persona: Beginner learner

A person who wants to understand market prices, order types, portfolio
performance, and risk without risking real savings.

### Secondary persona: Student or aspiring trader

A user who wants to test hypotheses, maintain a journal, and learn from
repeated practice.

### User stories

-   As a new user, I want to understand that all funds and orders are
    virtual.
-   As a user, I want to see my available virtual cash before placing an
    order.
-   As a user, I want to search for a supported asset and open its
    chart.
-   As a user, I want to preview an order's estimated cost before
    submitting it.
-   As a user, I want the server to reject an order that I cannot
    afford.
-   As a user, I want to see whether my order is pending, filled,
    partially filled, cancelled, or rejected.
-   As a user, I want to see my holdings, average cost, market value,
    and unrealized P&L.
-   As a user, I want to see realized P&L and transaction costs after
    closing a position.
-   As a user, I want to record why I entered and exited a trade.
-   As a user, I want to review my trading history and performance.
-   As a user, I want to know whether a displayed quote is live,
    delayed, historical, or demo data.
-   As a user, I want useful empty states and clear error messages when
    data is unavailable.

------------------------------------------------------------------------

## 5. Product Scope and Release Plan

### Release 1 --- MVP

1.  Authentication and user profile.
2.  Virtual wallet with configurable starting balance.
3.  Limited Indian equity universe.
4.  Asset search and watchlist.
5.  Price chart with supported historical intervals.
6.  Simulated market and limit orders.
7.  Server-side order validation and execution.
8.  Holdings, cash balance, order history, and transaction ledger.
9.  Portfolio summary and basic analytics.
10. Trade journal.
11. Responsive UI, accessibility basics, tests, and deployment
    documentation.

### Release 1.1 --- Learning improvements

-   More detailed risk metrics.
-   Benchmark comparison.
-   Educational order-type guides.
-   Improved trade review and journal prompts.
-   Better onboarding and user feedback collection.

### Release 2 --- Historical replay

-   Replay licensed historical candles in chronological order.
-   Hide future candles from the user during a replay session.
-   Support simulated orders during replay.
-   Keep replay portfolios and results clearly labelled as simulated.
-   Add repeatable scenarios and session summaries.

### Release 3 --- Multi-market expansion

-   Add US equities and cryptocurrency only after provider access,
    licensing, currency handling, and market-specific rules are defined.
-   Model market hours and trading calendars by venue.
-   Keep balances and asset currencies explicit; do not silently mix INR
    and USD.
-   Add a consolidated view with transparent FX assumptions where
    appropriate.

------------------------------------------------------------------------

## 6. Information Architecture

Primary navigation: - **Dashboard** - **Markets** - **Watchlist** -
**Portfolio** - **Orders & History** - **Trade Journal** - **Learn /
Help** - **Profile / Settings**

### 6.1 Dashboard

Display: - Total portfolio value. - Available virtual cash. - Day change
and total return, with calculation basis explained. - Open positions. -
Watchlist highlights. - Recent orders and transactions. - A clear
"Virtual portfolio" indicator. - Quote freshness and market status where
available.

Use restrained colour for positive and negative movement; never rely on
colour alone to communicate status.

### 6.2 Markets / Asset detail

Display: - Asset name, symbol, exchange or market, and currency. -
Latest available price and its timestamp. - Data status: live, delayed,
historical, or demo. - Price chart and volume when available. - Time
range controls supported by the provider. - Basic asset information
where licensed and available. - Buy and Sell actions that open an order
ticket.

Do not imply that demo prices are exchange prices. Do not invent quote
values or freshness.

### 6.3 Order ticket

Fields: - Asset. - Side: buy or sell. - Order type: market or limit. -
Quantity. - Limit price, only for limit orders. - Estimated order
value. - Estimated fees, if configured. - Estimated total cost or
proceeds. - Available virtual cash or sellable quantity. - Clear
simulation disclosure.

Validation: - Quantity must be greater than zero and respect configured
precision. - Limit price must be greater than zero for limit orders. -
Buys must not exceed available funds under the configured cost policy. -
Sells must not exceed available sellable quantity. - Duplicate
submissions must not create duplicate orders. - The backend must repeat
every validation; frontend checks are only for usability.

### 6.4 Portfolio

For each position show: - Symbol and asset name. - Quantity. - Average
cost. - Latest available price and timestamp. - Market value. -
Unrealized P&L and percentage, with formula documented.

Also show: - Available cash. - Reserved cash, if the chosen order model
reserves funds. - Total portfolio value. - Realized P&L. - Fees paid. -
Allocation by asset.

### 6.5 Orders and transaction history

Orders should show: - Order ID. - Created time. - Asset and side. -
Order type and submitted quantity. - Limit price when applicable. -
Filled quantity and average fill price. - Status. - Fees. - Cancellation
or rejection reason where relevant.

The transaction ledger should be append-only from the application's
normal business logic. Corrections should use explicit compensating
entries rather than silently editing past financial events.

### 6.6 Trade journal

Keep the journal short and useful. Fields may include: - Linked order or
position. - Entry thesis / reason. - Planned entry. - Planned stop-loss
and target (optional; informational only in MVP unless implemented as
real simulator logic). - Planned risk amount (optional). - Exit reason /
notes. - Lessons learned. - Created and updated timestamps.

Do not imply that a journal note or planned stop is an active stop
order.

### 6.7 Learning and help

Explain: - Market versus limit orders. - Bid, ask, spread, and liquidity
at a beginner level. - Realized versus unrealized P&L. - Fees and
slippage. - Risk, drawdown, and diversification. - Simulation
limitations and data delay.

------------------------------------------------------------------------

## 7. UX and Visual Design Requirements

### Visual direction

Create a clean, premium fintech interface inspired by modern investing
products, without copying a specific brand.

-   Desktop-first dashboard, responsive down to mobile widths.
-   Clear typography and consistent spacing.
-   Neutral background with restrained accent colours.
-   High information density where useful, but avoid clutter.
-   Consistent card, table, dialog, input, and button styles.
-   Light theme as the initial default; dark theme may be added if time
    allows.
-   Use icons consistently and include text labels for important
    actions.
-   Accessible contrast, keyboard navigation, visible focus states, and
    semantic form labels.
-   Loading, error, empty, and stale-data states must be designed---not
    left blank.
-   Confirm destructive or consequential actions, such as cancelling an
    order where appropriate.
-   Avoid decorative animations that interfere with chart reading or
    order entry.

### UI implementation

Use React, TypeScript, Vite, Tailwind CSS, and a consistent component
library such as shadcn/ui. Use reusable components for: - App layout and
navigation. - Market/asset rows. - Price and change displays. - Order
ticket. - Status badges. - Portfolio cards. - Data tables. - Form
validation and error messages. - Loading skeletons and empty states.

Use a suitable chart library such as TradingView Lightweight Charts
after checking current licence and attribution requirements. Do not use
a chart library as a source of market data.

------------------------------------------------------------------------

## 8. Technical Architecture

### 8.1 Stack

**Frontend** - React - TypeScript - Vite - Tailwind CSS - shadcn/ui or
equivalent - React Router - TanStack Query or an equivalent server-state
tool - A suitable charting library - Vitest and React Testing Library

**Backend** - Python - FastAPI - Pydantic - SQLAlchemy 2.x - Alembic
migrations - PostgreSQL - pytest - HTTPX for API integration tests

**Optional infrastructure** - Docker Compose for local development. -
Redis only when caching, rate limiting, or job coordination actually
requires it. - A background worker only when ingestion or analytics jobs
need independent execution.

### 8.2 Architectural style

Use a modular monolith initially. Keep domain logic separate from HTTP
route handlers and database access.

Suggested backend modules: - `auth` - `users` - `market_data` -
`assets` - `watchlists` - `orders` - `execution` - `ledger` -
`portfolio` - `journal` - `analytics`

The frontend must never be trusted to enforce cash balance, order
permissions, fees, or fills. The backend is authoritative.

### 8.3 Data flow

1.  The frontend requests market data or portfolio state from FastAPI.
2.  FastAPI authenticates and authorizes the request.
3.  The backend obtains data from the configured provider or stored
    historical data.
4.  For an order, the backend validates the request and applies the
    configured simulation rules.
5.  A database transaction records the order/fill, ledger movements,
    fees, and position changes consistently.
6.  The backend returns the canonical updated order and portfolio state.
7.  The frontend refreshes the relevant server state.

### 8.4 External market data

Create a provider adapter so provider-specific logic does not leak
throughout the application.

Requirements: - Use a provider whose terms permit the intended display
and use. - Store source and timestamp with each quote/bar. - Clearly
distinguish live, delayed, historical, and demo data. - Handle missing,
stale, out-of-order, and failed provider responses. - Respect rate
limits and caching terms. - Never invent real-time prices when the
provider is unavailable. - Use clearly labelled seeded/demo data for
development when necessary. - Do not expose provider API keys to the
browser.

Before selecting a provider, verify supported Indian symbols, history
depth, latency, redistribution/display rights, cost, and development
access.

------------------------------------------------------------------------

## 9. Trading Engine Requirements

This is the highest-priority correctness area of the product.

### 9.1 Order lifecycle

Use explicit, documented states such as: - `pending` -
`partially_filled` - `filled` - `cancelled` - `rejected`

Only implement states that are meaningful to the selected execution
model. Define allowed transitions and reject invalid transitions.

### 9.2 MVP execution policy

Document the simulator's assumptions before implementation.

**Market orders** - Execute using a defined price source and fill
policy. - If bid/ask quotes are available and licensed, use an explicit
side-aware policy. - If only last-trade or candle data is available,
clearly disclose the simplified assumption. - Apply configured fees and
any configured slippage. - Reject or defer execution when data is
missing or too stale according to a defined threshold.

**Limit orders** - Store the requested limit price. - Fill only
according to a documented rule and supported data granularity. - Do not
claim exact exchange queue position or exact intrabar execution from
OHLC data. - Define cancellation and partial-fill behaviour. - For the
initial MVP, it is acceptable to simplify the execution model as long as
the simplification is transparent and tested.

### 9.3 Money and accounting

-   Use decimal-safe numeric types for prices, quantities, fees, and
    monetary calculations.
-   Never use ordinary binary floating-point as the authoritative money
    ledger.
-   Define currency and permitted precision per asset.
-   Make all balance and position changes in an atomic database
    transaction.
-   Use database constraints and row-level locking or an equivalent
    concurrency strategy to prevent overspending.
-   Use idempotency keys or an equivalent safe duplicate-request
    mechanism for order submission.
-   Record enough information to audit how each balance and position was
    calculated.
-   Do not silently rewrite financial history.
-   Define rounding rules and apply them consistently.

### 9.4 Suggested formulas

For a simple long-only position: - **Trade notional** = executed
quantity × execution price. - **Buy cash debit** = trade notional +
applicable buy fees. - **Sell cash credit** = trade notional −
applicable sell fees. - **Market value** = current supported mark price
× open quantity. - **Unrealized P&L** = market value − remaining
position cost basis, adjusted according to the documented fee accounting
policy. - **Realized P&L** = sale proceeds after applicable costs − cost
basis allocated to the quantity sold.

The product must define how average cost, partial exits, fees, and
rounding affect cost basis. Tests should verify the selected accounting
policy. Do not mix realized and unrealized P&L or count the same fee
twice.

### 9.5 Security and integrity

-   Validate all order inputs server-side.
-   Authorize every resource against the authenticated user.
-   Prevent users from reading or modifying another user's portfolio,
    orders, or journal.
-   Use transactions and concurrency controls for account changes.
-   Never accept a client-provided balance as authoritative.
-   Never trust client-calculated P&L.
-   Avoid logging secrets or sensitive authentication tokens.
-   Apply rate limits to authentication and order endpoints.
-   Keep secrets in environment variables or a secret manager, never in
    source control.

------------------------------------------------------------------------

## 10. Data Model (Initial Proposal)

The exact schema can evolve during implementation, but it should support
these concepts.

### `users`

-   `id`
-   `email` (unique)
-   `password_hash` or external-auth subject
-   `created_at`
-   `updated_at`
-   `status`

### `accounts`

-   `id`
-   `user_id`
-   `base_currency`
-   `created_at`

### `assets`

-   `id`
-   `symbol`
-   `name`
-   `asset_type`
-   `market`
-   `quote_currency`
-   `exchange`
-   `is_enabled`

Use an appropriate uniqueness rule for symbol + market/exchange; a
ticker alone may not be globally unique.

### `quotes` or `market_bars`

-   `id`
-   `asset_id`
-   `price` or OHLCV fields
-   `source`
-   `data_status`
-   `observed_at`
-   `received_at`
-   `interval` where applicable

Choose a storage/retention strategy based on the provider and the
initial scale.

### `orders`

-   `id`
-   `user_id`
-   `account_id`
-   `asset_id`
-   `side`
-   `order_type`
-   `quantity`
-   `limit_price` (nullable)
-   `filled_quantity`
-   `average_fill_price` (nullable)
-   `status`
-   `idempotency_key`
-   `rejection_reason` (nullable)
-   `created_at`
-   `updated_at`

### `executions`

-   `id`
-   `order_id`
-   `quantity`
-   `price`
-   `fees`
-   `executed_at`
-   `execution_policy_version`
-   `market_data_reference` or equivalent source metadata

### `ledger_entries`

-   `id`
-   `account_id`
-   `order_id` (nullable)
-   `entry_type`
-   `currency`
-   `amount`
-   `created_at`
-   `metadata`

Define a consistent debit/credit or signed-amount convention and
document it. Entries should be auditable and normally append-only.

### `positions` (if maintained as a projection)

-   `id`
-   `account_id`
-   `asset_id`
-   `quantity`
-   `cost_basis`
-   `updated_at`

If positions are stored, define how they are reconciled against
executions and ledger records. Avoid having multiple competing sources
of truth.

### `watchlist_items`

-   `id`
-   `user_id`
-   `asset_id`
-   `created_at`

### `journal_entries`

-   `id`
-   `user_id`
-   `order_id` or position reference (nullable)
-   `thesis`
-   `planned_entry` (nullable)
-   `planned_stop` (nullable)
-   `planned_target` (nullable)
-   `exit_reason` (nullable)
-   `lesson_learned` (nullable)
-   `created_at`
-   `updated_at`

Add appropriate foreign keys, indexes, unique constraints, and deletion
policies. Use migrations; do not rely on manually editing production
schema.

------------------------------------------------------------------------

## 11. API Requirements

Use a versioned prefix such as `/api/v1`. Exact response shapes should
be written as Pydantic schemas and documented through OpenAPI.

### Authentication

-   `POST /api/v1/auth/register`
-   `POST /api/v1/auth/login`
-   `POST /api/v1/auth/logout` (if applicable to the auth design)
-   `GET /api/v1/users/me`

### Assets and market data

-   `GET /api/v1/assets`
-   `GET /api/v1/assets/{asset_id}`
-   `GET /api/v1/assets/{asset_id}/quotes`
-   `GET /api/v1/assets/{asset_id}/bars`
-   `GET /api/v1/watchlist`
-   `POST /api/v1/watchlist`
-   `DELETE /api/v1/watchlist/{asset_id}`

### Orders

-   `POST /api/v1/orders`
-   `GET /api/v1/orders`
-   `GET /api/v1/orders/{order_id}`
-   `POST /api/v1/orders/{order_id}/cancel` (only when cancellation is
    valid)

### Portfolio and history

-   `GET /api/v1/portfolio`
-   `GET /api/v1/portfolio/positions`
-   `GET /api/v1/ledger`
-   `GET /api/v1/executions`

### Journal and analytics

-   `GET /api/v1/journal`
-   `POST /api/v1/journal`
-   `PATCH /api/v1/journal/{entry_id}`
-   `DELETE /api/v1/journal/{entry_id}` (if deletion is supported)
-   `GET /api/v1/analytics/summary`

Requirements: - Use correct HTTP status codes. - Return consistent
structured error responses. - Paginate history endpoints. - Validate and
cap user-controlled page sizes. - Add authentication and authorization
to all private endpoints. - Use idempotency protection for order
submission. - Publish API contracts and generate/use typed frontend
client definitions where practical. - Never expose internal stack traces
or secrets in production responses.

------------------------------------------------------------------------

## 12. Portfolio and Analytics

MVP analytics: - Total portfolio value. - Available cash. - Position
market value. - Realized P&L. - Unrealized P&L. - Total fees. - Return
over a documented period. - Win rate and average win/loss only when the
definition is clearly stated. - Maximum drawdown only when sufficient
portfolio valuation history exists. - Asset allocation.

Requirements: - State the calculation period and formula. - Label data
timestamps and missing-data cases. - Do not treat unrealized gains as
realized cash. - Do not compare returns against a benchmark unless the
benchmark data and comparison period are aligned. - Avoid suggesting
that historical results predict future performance.

------------------------------------------------------------------------

## 13. Testing and Acceptance Criteria

### 13.1 Core acceptance criteria

The MVP is not complete until:

1.  A new user can register and receive the configured virtual starting
    balance exactly once.
2.  A user can search for an enabled asset and see its symbol, market,
    currency, price and data timestamp.
3.  An affordable valid buy order can be submitted and processed
    according to the documented simulation policy.
4.  An unaffordable order is rejected without changing cash or
    positions.
5.  A sell order cannot sell more than the user's available position.
6.  A completed trade creates the expected execution, fee, ledger, cash
    and position changes atomically.
7.  Duplicate order requests do not create duplicate financial effects.
8.  Concurrent orders cannot spend the same available virtual cash
    twice.
9.  Realized and unrealized P&L agree with independently verified test
    cases.
10. Order status and transaction history persist after logout and login.
11. A user cannot access another user's account data by changing an ID
    in a request.
12. The UI clearly labels the product and balances as virtual/simulated.
13. Missing or stale market data is handled without inventing prices.
14. The application is usable on common desktop and mobile viewport
    sizes.
15. Database migrations and setup instructions allow another developer
    to run the project locally.

### 13.2 Test categories

**Unit tests** - Fee calculation. - Quantity and price validation. -
Cost basis. - Realized and unrealized P&L. - Order state transitions. -
Rounding and currency precision.

**Integration tests** - Order submission with a real test database. -
Atomic balance/position updates. - Idempotent retries. -
Insufficient-funds rejection. - Concurrent order submissions. -
User-level authorization. - Migration up/down or forward migration
verification.

**Frontend tests** - Order form validation. - Loading and error
states. - Portfolio rendering. - Order status display. - Accessible form
labels and keyboard flow.

**End-to-end tests** - Register/login → view asset → submit order →
verify portfolio → review order history → create journal note.

------------------------------------------------------------------------

## 14. Security, Privacy, and Product Disclosures

-   Use a maintained authentication implementation.
-   Store password hashes using an appropriate password hashing
    algorithm if handling passwords directly.
-   Use secure cookie/session settings appropriate to the deployment, or
    a well-designed token strategy.
-   Configure CORS narrowly for known frontend origins.
-   Validate all user input and avoid SQL injection through
    parameterized ORM usage.
-   Keep API keys and secrets out of frontend bundles and source
    control.
-   Do not expose one user's records to another user.
-   Collect only data needed for the product.
-   Provide a basic privacy notice before inviting external beta users.
-   Clearly disclose virtual money, simulated execution, market-data
    status, and simulator limitations.
-   Do not market the product as financial advice or a guaranteed way to
    make money.
-   Review applicable terms and legal obligations before public launch,
    particularly for market-data display and educational financial
    products.

------------------------------------------------------------------------

## 15. Performance and Reliability Targets

Initial targets for a small beta: - Typical API requests should respond
within approximately 500 ms at the 95th percentile, excluding external
provider latency and heavy analytics; measure rather than assume. - Core
screens should display useful content quickly and show loading states
for slower requests. - Market-data failures must not corrupt order
accounting. - Order processing must be atomic and auditable. - Errors
should be logged with correlation/request IDs without logging secrets. -
Provide a health-check endpoint. - Add automated database backups once
deployed with persistent user data. - Document how to restore a backup
and test the procedure before relying on it.

These are initial engineering targets, not guarantees. Revisit them
after measuring the deployed beta.

------------------------------------------------------------------------

## 16. Development Workflow

-   Keep frontend and backend in a single repository initially, unless
    the team has a clear reason to separate them.
-   Use Git branches and pull requests.
-   Require review by the other developer for changes to the trading
    engine, accounting, authentication, and database schema.
-   Use environment-specific configuration.
-   Commit `.env.example`, never real `.env` secrets.
-   Use Docker Compose for consistent local PostgreSQL and optional
    supporting services.
-   Run linting, type checks, migrations and tests before merging.
-   Maintain a short architecture decision record for important
    simulation and accounting choices.
-   Seed demo assets and clearly labelled demo data for local
    development.
-   Keep a `README.md` with setup, commands, environment variables,
    migrations, tests and known limitations.

------------------------------------------------------------------------

## 17. Two-Person Team Plan

### Developer A --- Frontend and product experience

-   React application structure and routing.
-   Design system and reusable components.
-   Dashboard, markets, order ticket, portfolio, history and journal
    screens.
-   Client-side validation for usability.
-   Frontend tests and responsive design.
-   Integration with the documented API contract.

### Developer B --- Backend and domain logic

-   FastAPI structure and API schemas.
-   PostgreSQL models and migrations.
-   Authentication and authorization.
-   Market-data adapter.
-   Order lifecycle, execution policy and ledger.
-   Portfolio calculations and backend tests.

### Shared responsibilities

-   Agree on order rules and accounting before implementation.
-   Review each other's code.
-   Maintain API contracts.
-   Test full user journeys.
-   Review security and deployment readiness.
-   Collect beta-user feedback and prioritize changes.

Both developers should understand the accounting model; it must not
become a black box owned by only one person.

------------------------------------------------------------------------

## 18. Suggested 10-Week Plan

### Week 1 --- Specification and design

-   Finalize MVP scope.
-   Draw key user flows and screens.
-   Agree on order lifecycle and accounting rules.
-   Verify market-data options and licensing.
-   Create repository and initial architecture.

### Weeks 2--3 --- Foundation

-   Set up React + TypeScript and FastAPI.
-   Configure PostgreSQL, SQLAlchemy and Alembic.
-   Implement authentication and user profile.
-   Implement asset catalogue, watchlist and market-data adapter.
-   Build initial dashboard and chart screen.

### Weeks 4--5 --- Trading engine

-   Implement wallet and ledger.
-   Implement market and limit order models.
-   Implement execution policy and fee handling.
-   Implement positions and order history.
-   Add accounting, concurrency and idempotency tests.

### Weeks 6--7 --- Portfolio learning

-   Implement portfolio and P&L views.
-   Implement journal.
-   Add basic analytics and explanatory help.
-   Verify all formulas with independently calculated examples.

### Week 8 --- UX and hardening

-   Responsive layout and accessibility.
-   Loading, error, stale-data and empty states.
-   Authorization and security checks.
-   Fix calculation and workflow defects.

### Weeks 9--10 --- Beta readiness

-   Deploy a small beta using a suitable host.
-   Configure secrets, logs and backups as appropriate.
-   Run end-to-end tests.
-   Invite a small group of users.
-   Record feedback and prioritize the next release.

This timeline assumes steady work by both developers and a manageable
data integration. If data access or execution rules prove more
complicated, extend the schedule instead of weakening correctness tests.

------------------------------------------------------------------------

## 19. Deployment Strategy

### Local development

-   Run frontend and backend locally.
-   Use PostgreSQL locally, optionally through Docker Compose.
-   Use demo data when the external provider is unavailable.
-   Keep configuration in environment variables.

### First beta

-   Use a managed frontend host, application host and managed PostgreSQL
    if convenient.
-   Configure HTTPS, secrets, logs, backups and database migrations.
-   Use a small asset universe and conservative rate limits.
-   Confirm provider licensing permits the intended beta use.

### Future AWS migration

AWS is explicitly out of scope for the first development phase. If/when
needed, possible services include: - ECS or App Runner for FastAPI. -
RDS for PostgreSQL. - S3 and CloudFront for static assets where
appropriate. - CloudWatch for logs and monitoring. - Secrets Manager for
secrets.

Do not introduce AWS, Redis, Kubernetes, or a multi-service architecture
solely for résumé keywords. Add infrastructure when the product
requirements justify it.

------------------------------------------------------------------------

## 20. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Market data is expensive or         Verify provider access, terms,
  restricted                          history and redistribution rights
                                      before committing.

  Incorrect balances or P&L           Ledger-first accounting,
                                      decimal-safe values, atomic
                                      transactions and independent tests.

  Duplicate orders from retries       Idempotency keys and database
                                      constraints.

  Concurrent orders overspend cash    Locking or equivalent transaction
                                      isolation and concurrency tests.

  Users mistake simulation for real   Persistent virtual-trading labels
  trading                             and explicit data/execution
                                      disclosures.

  Scope becomes too large             Limit MVP to one market and a few
                                      core learning features.

  Poor retention                      Observe users, measure repeat use
                                      and improve the trade-review loop.

  Security or privacy failures        Authorization tests, safe secret
                                      handling and minimal data
                                      collection.

  Replay gives misleading fills       Document assumptions and do not
                                      claim exchange-level execution
                                      accuracy from insufficient data.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 21. Success Metrics

For the first beta, measure: - Registration completion. - Percentage of
users who complete their first simulated trade. - Percentage who review
a trade or create a journal entry. - Return usage after seven days. -
User-reported clarity of order and portfolio information. -
Trading-engine test coverage for critical accounting paths. - Number of
reproducible accounting defects (target: zero known critical defects
before beta). - Successful end-to-end user journeys.

Do not optimize for trade volume alone. The product is intended to teach
responsible market understanding, not encourage excessive activity.

------------------------------------------------------------------------

## 22. Definition of Done

A feature is done when: - Its user flow is implemented. - API validation
and authorization are in place. - Loading, empty, error and success
states are handled. - Unit and integration tests cover critical
behaviour. - The frontend works at target viewport sizes. -
Documentation is updated. - No secrets are committed. - The feature does
not break balance, ledger, or portfolio invariants.

The MVP is ready for a limited beta when all core acceptance criteria
pass, data status is clear, the app is deployed with appropriate
safeguards, and another developer can run it using the README.

------------------------------------------------------------------------

## 23. Instructions for Antigravity

Use this PRD as the source of truth for implementation.

1.  Inspect the existing repository before making changes.
2.  If the repository is empty, scaffold the frontend and backend
    according to this document.
3.  Create a concise implementation plan and a task checklist before
    coding.
4.  Implement in small, testable phases; do not attempt every feature in
    one large change.
5.  Prioritize authentication, asset data, wallet/ledger integrity,
    order execution, and portfolio calculations before secondary
    features.
6.  Define API schemas and database migrations before wiring the UI to
    unstable endpoints.
7.  Use demo market data only when clearly labelled. Never invent live
    quotes.
8.  Keep all financial decisions on the backend.
9.  Add tests for accounting, order validation, idempotency, concurrency
    and authorization.
10. Do not add real-money trading, leverage, options, social features,
    AI predictions, or AWS infrastructure in the MVP.
11. When requirements are ambiguous, document the assumption and choose
    the simplest safe implementation.
12. After each phase, run the relevant tests and report what passed,
    what remains, and any known limitations.
13. Do not claim a feature is complete unless it is implemented and
    tested.
14. Finish with setup instructions, environment variable documentation,
    migration instructions, test commands and a clear list of deferred
    work.

### First implementation milestone

Before building the full UI, deliver: - Repository structure. - Local
setup instructions. - Database connection and first migration. -
Health-check endpoint. - Asset model and seeded demo assets. - Basic
frontend shell. - A short documented order/accounting policy.

Then proceed to the trading engine and complete buy/sell workflow.

------------------------------------------------------------------------

## 24. Open Decisions to Resolve During Week 1

These decisions must be made before the relevant feature is
implemented: - Which licensed market-data provider and plan will be
used? - Which Indian assets are included in the initial universe? - What
is the virtual starting balance? - What fee model is used in
simulation? - What exact fill policy applies to market and limit
orders? - What quote-staleness threshold prevents execution? - Will
limit orders reserve virtual funds or validate funds only when filled? -
Which cost-basis policy is used for partial exits? - Which
authentication approach is appropriate for the beta? - Which hosting
provider will be used for the first public beta?

Record decisions in the repository so both developers and Antigravity
implement the same behaviour.

------------------------------------------------------------------------

**End of PRD**
