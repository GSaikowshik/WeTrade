export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
export type LedgerEntryType = 'DEPOSIT' | 'ORDER_BUY' | 'ORDER_SELL' | 'FEE' | 'REVERSAL';

export interface User {
  id: number;
  email: string;
  full_name?: string;
  status: string;
  created_at: string;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: string;
  market: string;
  exchange: string;
  quote_currency: string;
  current_price: number;
  change_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  data_status: string;
  last_updated_at: string;
}

export interface Bar {
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface Quote {
  id: number;
  asset_id: number;
  price: number;
  bid?: number;
  ask?: number;
  source: string;
  data_status: string;
  observed_at: string;
}

export interface CryptoTicker {
  symbol: string;
  price: number;
  quote_currency: string;
  source: string;
  fetched_at: string;
}

export interface Position {
  id: number;
  asset_id: number;
  symbol: string;
  name: string;
  exchange: string;
  quantity: number;
  average_cost: number;
  cost_basis: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_return_pct: number;
  realized_pnl: number;
}

export interface Allocation {
  symbol: string;
  name: string;
  market_value: number;
  percentage: number;
}

export interface PortfolioSummary {
  total_portfolio_value: number;
  available_cash: number;
  total_market_value: number;
  total_unrealized_pnl: number;
  total_unrealized_return_pct: number;
  total_realized_pnl: number;
  total_fees_paid: number;
  currency: string;
  positions: Position[];
  allocations: Allocation[];
}

export interface Execution {
  id: number;
  order_id: number;
  quantity: number;
  price: number;
  fees: number;
  executed_at: string;
  execution_policy_version: string;
  market_data_reference?: string;
}

export interface Order {
  id: number;
  user_id: number;
  account_id: number;
  asset_id: number;
  asset_symbol?: string;
  asset_name?: string;
  side: OrderSide;
  order_type: OrderType;
  quantity: number;
  limit_price?: number;
  filled_quantity: number;
  average_fill_price?: number;
  fees_paid: number;
  status: OrderStatus;
  rejection_reason?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  executions: Execution[];
}

export interface LedgerEntry {
  id: number;
  account_id: number;
  order_id?: number;
  entry_type: LedgerEntryType;
  currency: string;
  amount: number;
  resulting_balance: number;
  created_at: string;
  metadata_json?: string;
}

export interface JournalEntry {
  id: number;
  user_id: number;
  order_id?: number;
  asset_id?: number;
  asset_symbol?: string;
  thesis: string;
  planned_entry?: number;
  planned_stop?: number;
  planned_target?: number;
  exit_reason?: string;
  lesson_learned?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  total_realized_pnl: number;
  total_fees_paid: number;
  net_pnl: number;
  largest_win: number;
  largest_loss: number;
}

