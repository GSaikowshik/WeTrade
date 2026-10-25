import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Asset, PortfolioSummary, Order, User, AnalyticsSummary } from '../types';
import { api } from '../api/client';
import { OrderTicket } from '../components/OrderTicket';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

interface DashboardProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
  onOpenAuth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  portfolio,
  onRefreshPortfolio,
  onOpenAuth,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedAssetForTrade, setSelectedAssetForTrade] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1D');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const assetList = await api.getAssets();
      setAssets(assetList);

      if (user) {
        const [ordersList, analyticsData] = await Promise.all([
          api.getOrders(),
          api.getAnalytics().catch(() => null),
        ]);
        setRecentOrders(ordersList.slice(0, 5));
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  const totalValue = toNum(portfolio?.total_portfolio_value) || 100000;
  const cash = toNum(portfolio?.available_cash) || 100000;
  const holdingsValue = toNum(portfolio?.total_market_value);
  const unrealizedPnl = toNum(portfolio?.total_unrealized_pnl);
  const unrealizedPct = toNum(portfolio?.total_unrealized_return_pct);
  const realizedPnl = toNum(portfolio?.total_realized_pnl);
  const isPnlPositive = unrealizedPnl >= 0;
  const isRealizedPositive = realizedPnl >= 0;

  const cashPct = totalValue > 0 ? Math.min(100, Math.max(0, (cash / totalValue) * 100)) : 100;
  const equityPct = totalValue > 0 ? Math.max(0, 100 - cashPct) : 0;
  const cashCircumference = 301.6;
  const cashOffset = cashCircumference * (1 - cashPct / 100);

  return (
    <div className="flex flex-col w-full pb-space-xl space-y-space-lg animate-in fade-in duration-150">
      {/* Top Workspace Context Strip */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pt-2 pb-space-xs border-b border-surface-container-high/60">
        <div className="flex flex-col max-w-2xl">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider text-[11px]">
              Trading Desk
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider text-[11px]">
              Simulated Environment
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-semibold">
            Your trading workspace
          </h1>
          <p className="font-body-md text-body-md text-text-secondary mt-1">
            Real-time simulated NSE execution. Zero risk, professional market practice with institutional rigor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-badge-demo-bg shadow-xs border border-surface-container-high/60">
            <span className="w-2 h-2 rounded-full bg-market-up animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-badge-demo-text uppercase font-semibold tracking-wider text-[10px]">
              DEMO FEED: REAL-TIME CALIBRATED
            </span>
          </div>
          <Link
            to="/portfolio"
            className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-xs border border-surface-container-high/60"
          >
            <span className="material-symbols-outlined text-[16px] text-text-secondary">pie_chart</span>
            <span>View Portfolio</span>
          </Link>
          <Link
            to="/markets"
            className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">travel_explore</span>
            <span>Explore Markets</span>
          </Link>
          {!user && (
            <button
              onClick={onOpenAuth}
              className="px-space-md py-2 rounded-lg bg-surface-card hover:bg-surface-subtle text-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 border border-primary/30 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </section>

      {/* Metric Architecture (Top 4-Card Ribbon) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Card 1: Total Portfolio Value */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              Total Portfolio Value
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              account_balance_wallet
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold tracking-tight">
              ₹{fmtMoney(totalValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-label-md text-label-md text-text-secondary text-xs">
                Starting capital allocated: ₹1,00,000.00
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Available Cash */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              Available Virtual Cash
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              payments
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold tracking-tight">
              ₹{fmtMoney(cash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-market-up"></span>
              <span className="font-label-md text-label-md text-market-up font-medium text-xs">
                {cashPct.toFixed(0)}% liquid & unencumbered
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Unrealized P&L */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              Unrealized P&amp;L
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              monitoring
            </span>
          </div>
          <div className="mt-space-md">
            <div
              className={`font-numeric-lg text-numeric-lg font-semibold tracking-tight ${
                isPnlPositive ? 'text-market-up' : 'text-market-down'
              }`}
            >
              {isPnlPositive ? '+' : ''}₹{fmtMoney(unrealizedPnl)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  isPnlPositive
                    ? 'bg-market-up-subtle text-market-up'
                    : 'bg-market-down-subtle text-market-down'
                }`}
              >
                {isPnlPositive ? '+' : ''}
                {fmtPct(unrealizedPct)}% return
              </span>
              <span className="font-label-sm text-[11px] text-text-tertiary">
                Holdings: ₹{fmtMoney(holdingsValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Realized P&L / Trade Win Rate */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-[11px]">
              Realized P&amp;L / Win Rate
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              query_stats
            </span>
          </div>
          <div className="mt-space-md">
            <div
              className={`font-numeric-lg text-numeric-lg font-semibold tracking-tight ${
                isRealizedPositive ? 'text-market-up' : 'text-market-down'
              }`}
            >
              {isRealizedPositive ? '+' : ''}₹{fmtMoney(realizedPnl)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-medium text-text-primary">
                {analytics?.win_rate_pct != null
                  ? `${analytics.win_rate_pct.toFixed(0)}% Win Rate`
                  : '0% Win Rate'}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="text-text-secondary">
                {analytics?.total_trades ?? recentOrders.length} closed trades
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chart & Allocation Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left 8-col: Performance Trajectory */}
        <div className="lg:col-span-8 p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container-low">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                Performance Trajectory
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary text-xs">
                Simulated valuation trajectory against initial virtual deposit
              </p>
            </div>
            <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg self-start sm:self-auto border border-surface-container-high/40">
              {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded font-label-sm text-[11px] font-semibold transition-colors ${
                    timeframe === tf
                      ? 'bg-surface-card text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Trajectory Chart */}
          <div className="relative w-full h-64 mt-space-sm">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 800 240"
            >
              <defs>
                <linearGradient id="baselineGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00422d" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#00422d" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal gridlines */}
              <line stroke="#E5E8E2" strokeDasharray="3 3" x1="0" x2="800" y1="60" y2="60" />
              <line stroke="#E5E8E2" strokeDasharray="3 3" x1="0" x2="800" y1="120" y2="120" />
              <line stroke="#E5E8E2" strokeDasharray="3 3" x1="0" x2="800" y1="180" y2="180" />

              {/* Area fill */}
              <polygon
                fill="url(#baselineGrad)"
                points="0,170 120,165 240,158 360,140 480,148 600,132 720,124 800,118 800,240 0,240"
              />
              {/* Main curve */}
              <polyline
                fill="none"
                stroke="#00422d"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,170 120,165 240,158 360,140 480,148 600,132 720,124 800,118"
              />
              {/* Final active marker */}
              <circle cx="800" cy="118" r="4.5" fill="#00422d" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* In-chart metadata pills */}
            <div className="absolute top-2 left-3 px-2 py-1 rounded bg-surface-card/90 backdrop-blur border border-surface-container-high/80 text-[11px] shadow-xs">
              <span className="text-text-secondary">Deposit: </span>
              <span className="font-semibold text-text-primary">₹1,00,000.00</span>
            </div>
            <div className="absolute top-2 right-3 px-2 py-1 rounded bg-surface-card/90 backdrop-blur border border-surface-container-high/80 text-[11px] shadow-xs">
              <span className="text-text-secondary">Current Mark: </span>
              <span className="font-semibold text-market-up">₹{fmtMoney(totalValue)}</span>
            </div>
          </div>

          <div className="pt-space-xs flex items-center justify-between text-xs text-text-tertiary border-t border-surface-container-low">
            <span>NSE Equities Intraday Engine</span>
            <span>Simulated Ledger Invariants: Active</span>
          </div>
        </div>

        {/* Right 4-col: Capital Allocation Donut */}
        <div className="lg:col-span-4 p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                Capital Allocation
              </h2>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-secondary text-[10px]">
                Liquid Asset Model
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary text-xs">
              Asset deployment across virtual cash &amp; open equities
            </p>
          </div>

          {/* Donut Vector Chart */}
          <div className="py-space-md flex flex-col items-center justify-center relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle cx="60" cy="60" fill="none" r="48" stroke="#ECEFEA" strokeWidth="12" />
              {/* Cash Ring */}
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="48"
                stroke="#00422d"
                strokeWidth="12"
                strokeDasharray="301.6"
                strokeDashoffset={cashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-numeric-md text-numeric-md font-semibold text-text-primary">
                {cashPct.toFixed(0)}%
              </span>
              <span className="font-label-sm text-[10px] text-text-secondary uppercase tracking-widest mt-0.5 font-medium">
                INR CASH
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="flex flex-col gap-2 pt-space-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-text-primary font-medium">Virtual Cash Reserve</span>
              </div>
              <span className="font-numeric-sm font-semibold text-text-primary">
                ₹{fmtMoney(cash)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                <span className="text-text-primary font-medium">Open Equities</span>
              </div>
              <span className="font-numeric-sm font-semibold text-text-primary">
                ₹{fmtMoney(holdingsValue)} ({equityPct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported NSE Equities (Dense Table / Grid) */}
      <section className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                Supported NSE Equities
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-sm text-[11px] font-medium border border-border-subtle">
                {assets.length || 6} Instruments
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary text-xs">
              Real-time simulation feed calibrated to Indian standard indices
            </p>
          </div>

          <div className="flex items-center gap-space-xs text-xs text-text-tertiary">
            <span>Tick-by-tick simulation</span>
            <Link
              to="/markets"
              className="font-medium text-primary hover:text-on-primary-fixed-variant ml-2 flex items-center gap-1"
            >
              <span>View Terminal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Dense Data Table */}
        <div className="overflow-x-auto -mx-space-md px-space-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/80 text-text-secondary font-label-sm text-[11px] uppercase tracking-wider h-9">
                <th className="py-2 px-3 font-semibold rounded-l-md">Symbol &amp; Company</th>
                <th className="py-2 px-3 font-semibold text-right">LTP (₹)</th>
                <th className="py-2 px-3 font-semibold text-right">24h Change</th>
                <th className="py-2 px-3 font-semibold text-right">Day Range (L - H)</th>
                <th className="py-2 px-3 font-semibold text-right">Sector</th>
                <th className="py-2 px-3 font-semibold text-center">7D Trend</th>
                <th className="py-2 px-3 font-semibold text-right rounded-r-md">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-xs">
              {assets.map((asset) => {
                const price = toNum(asset.current_price) || 1000;
                const change = toNum(asset.change_24h);
                const changePct = toNum(asset.change_24h);
                const isPositive = change >= 0;
                const dayLow = toNum(asset.low_24h) || price * 0.985;
                const dayHigh = toNum(asset.high_24h) || price * 1.015;

                return (
                  <tr key={asset.id} className="hover:bg-surface-subtle/60 transition-colors group">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center font-bold text-[11px] text-text-primary shadow-2xs">
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <Link
                            to={`/markets?symbol=${asset.symbol}`}
                            className="font-numeric-sm text-sm font-semibold text-text-primary hover:text-primary transition-colors"
                          >
                            {asset.symbol}
                          </Link>
                          <span className="text-text-secondary text-[11px]">{asset.name}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-numeric-md font-semibold text-text-primary">
                      ₹{fmtMoney(price)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-semibold text-[11px] ${
                          isPositive
                            ? 'bg-market-up-subtle text-market-up'
                            : 'bg-market-down-subtle text-market-down'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        <span>
                          {isPositive ? '+' : ''}₹{fmtMoney(change)} ({fmtPct(changePct)}%)
                        </span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-text-secondary">
                      ₹{fmtMoney(dayLow, 1)} – ₹{fmtMoney(dayHigh, 1)}
                    </td>

                    <td className="py-3 px-3 text-right text-text-secondary">
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-[11px]">
                        {asset.exchange}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <svg className="w-20 h-5 inline-block" viewBox="0 0 80 20">
                        <polyline
                          fill="none"
                          stroke={isPositive ? '#0F766E' : '#B91C1C'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={
                            isPositive
                              ? '0,15 15,14 30,16 45,9 60,11 80,4'
                              : '0,5 15,7 30,4 45,13 60,10 80,16'
                          }
                        />
                      </svg>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAssetForTrade(asset)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-on-primary text-text-primary font-label-md text-xs font-semibold transition-all shadow-2xs"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Section: Recent Orders & We Trade Academy */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left 7-col: Recent Simulated Orders */}
        <div className="lg:col-span-7 p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-low">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                  Recent Simulated Orders
                </h2>
                <p className="font-body-sm text-body-sm text-text-secondary text-xs">
                  Audit log of your simulated intraday &amp; delivery fills
                </p>
              </div>
              <Link
                to="/orders"
                className="font-label-sm text-xs font-semibold text-primary hover:text-on-primary-fixed-variant"
              >
                View All
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="divide-y divide-surface-container-low mt-2">
                {recentOrders.map((ord) => {
                  const isBuy = ord.side === 'BUY';
                  const fillPrice = toNum(ord.average_fill_price) || toNum(ord.limit_price);
                  return (
                    <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isBuy
                              ? 'bg-market-up-subtle text-market-up'
                              : 'bg-market-down-subtle text-market-down'
                          }`}
                        >
                          {ord.side}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">
                            {ord.asset_symbol || 'NSE'}
                          </span>
                          <span className="text-text-tertiary text-[10px]">
                            {ord.order_type} • {ord.quantity} shares
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col text-right">
                          <span className="font-numeric-sm font-semibold text-text-primary">
                            ₹{fmtMoney(fillPrice)}
                          </span>
                          <span className="text-[10px] text-text-secondary uppercase">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-text-tertiary mb-space-sm">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary font-medium">
                  No trades executed yet
                </h3>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1 text-xs">
                  Simulate your first market or limit order using your ₹1,00,000.00 virtual capital balance with live market depth.
                </p>
                <Link
                  to="/markets"
                  className="mt-space-md px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Place Simulated Order</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-space-xs text-center border-t border-surface-container-low mt-4">
            <span className="font-label-sm text-[11px] text-text-tertiary">
              All simulated fills conform to actual NSE order matching principles.
            </span>
          </div>
        </div>

        {/* Right 5-col: We Trade Academy: Paper Trading 101 */}
        <div className="lg:col-span-5 p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                  We Trade Academy
                </h2>
              </div>
              <span className="font-label-sm text-[11px] text-primary font-semibold">
                CURRICULUM
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary text-xs mt-1">
              Core simulation principles before committing real market capital
            </p>

            {/* Checklist items */}
            <div className="flex flex-col gap-2 mt-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-subtle/70 flex items-start gap-2.5 border border-border-subtle/50">
                <span className="material-symbols-outlined text-market-up text-[18px] shrink-0">
                  check_circle
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">
                    Market Orders vs Limit Orders
                  </span>
                  <span className="text-text-secondary text-[11px]">
                    Market executes immediately with slippage. Limit executes only when price matches your target.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-subtle/70 flex items-start gap-2.5 border border-border-subtle/50">
                <span className="material-symbols-outlined text-market-up text-[18px] shrink-0">
                  check_circle
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">
                    Brokerage, STT &amp; Taxes Emulation
                  </span>
                  <span className="text-text-secondary text-[11px]">
                    ₹20 flat brokerage plus STT/turnover charges deducted directly from ledger upon execution.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-subtle/70 flex items-start gap-2.5 border border-border-subtle/50">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                  radio_button_unchecked
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">
                    Write Your Trade Thesis in Journal
                  </span>
                  <span className="text-text-secondary text-[11px]">
                    Document stop-loss, risk-reward ratio, and rationale to avoid emotional biases.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-container-low mt-4 flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Learn at your own pace</span>
            <Link
              to="/learn"
              className="text-xs font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1"
            >
              <span>Explore All Lessons</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Order Ticket Modal (Stitch Modal Overlay) */}
      {selectedAssetForTrade && (
        <OrderTicket
          asset={selectedAssetForTrade}
          portfolio={portfolio}
          onClose={() => setSelectedAssetForTrade(null)}
          onSuccess={() => {
            setSelectedAssetForTrade(null);
            onRefreshPortfolio();
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
