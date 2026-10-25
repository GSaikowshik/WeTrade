# We Trade — Simulation, Accounting & Order Execution Policy

## 1. Core Principles
1. **Authoritative Backend:** All balance, position, fee, and order calculations are performed on the server.
2. **Decimal-Safe Precision:** All monetary amounts (prices, balances, fees, notional values) are tracked as 2-decimal or 4-decimal exact fixed-point decimals (`NUMERIC(18, 4)` and `NUMERIC(14, 2)`). Floating-point representation is forbidden for ledger calculations.
3. **Double-Entry Append-Only Ledger:** The `ledger_entries` table is strictly append-only. No financial events are deleted or mutated. Corrections require compensating reversal entries.
4. **Strict Concurrency Protection:** Account balance checks utilize row-level locking (`SELECT ... FOR UPDATE` on `accounts`) within atomic database transactions to completely prevent overspending or race conditions.
5. **Idempotent Order Submissions:** Every order submission requires a client-provided or auto-generated `idempotency_key`. Duplicate requests with the same key safely return the existing order without duplicate debiting or duplicate fills.

---

## 2. Wallet & Starting Capital
- Each registered user receives an `account` with base currency **INR**.
- A starting capital of **₹100,000.00** is credited once via an initial `DEPOSIT` ledger entry.

---

## 3. Fee Structure
To teach realistic trading frictions:
- **Brokerage:** Flat ₹20 per executed order, or 0.03% of trade value (whichever is lower).
- **Exchange / STT / Statutory Charges:** 0.05% of trade value.
- Total execution fees = `min(20, 0.0003 * notional) + (0.0005 * notional)`.
- Fees are deducted from cash for both buy and sell orders.

---

## 4. Execution Policy

### Market Orders
- **Pricing:** Executed at current mark price with 0.05% (5 bps) simulated slippage (higher for buys, lower for sells).
  - Buy fill price: `mark_price * 1.0005`
  - Sell fill price: `mark_price * 0.9995`
- **Quote Freshness:** If the quote is older than 60 seconds (`observed_at` < `now() - 60s`), the order is rejected with `REJECTED_STALE_QUOTE` to prevent fills against outdated data.
- **Affordability Check:** `estimated_total_cost = (quantity * fill_price) + estimated_fees`. If `account.cash_balance < estimated_total_cost`, order is rejected with `INSUFFICIENT_FUNDS`.

### Limit Orders
- Limit orders are accepted in `PENDING` status.
- Evaluated against current market price:
  - **Buy Limit:** Fills when `current_price <= limit_price`. Fill price is `limit_price` (or current price if more favorable).
  - **Sell Limit:** Fills when `current_price >= limit_price`. Fill price is `limit_price` (or current price if more favorable).
- Cancellation is permitted while status is `PENDING`.

---

## 5. Cost-Basis & P&L Accounting Formulas

### Average Cost Basis
When holding an existing position and adding more shares:
$$\text{New Cost Basis} = \frac{(\text{Current Qty} \times \text{Current Avg Price}) + (\text{New Qty} \times \text{Fill Price})}{\text{Current Qty} + \text{New Qty}}$$

### Realized P&L (On Sell)
When selling `Q_sold` shares at `P_sell` with historical average cost `P_avg` and sell fees `F_sell`:
$$\text{Realized P\&L} = (\text{P\_sell} - \text{P\_avg}) \times \text{Q\_sold} - \text{F\_sell}$$

### Unrealized P&L (Open Positions)
For an open position of `Q_open` shares at current mark price `P_mark` with average cost `P_avg`:
$$\text{Market Value} = \text{Q\_open} \times \text{P\_mark}$$
$$\text{Unrealized P\&L} = (\text{P\_mark} - \text{P\_avg}) \times \text{Q\_open}$$
$$\text{Unrealized Return \%} = \frac{\text{P\_mark} - \text{P\_avg}}{\text{P\_avg}} \times 100$$

### Total Portfolio Value
$$\text{Total Portfolio Value} = \text{Available Cash} + \sum (\text{Position Market Values})$$
$$\text{Total Return} = \text{Total Portfolio Value} - \text{Total Deposits (₹100,000)}$$

