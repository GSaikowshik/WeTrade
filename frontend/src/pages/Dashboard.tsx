import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Asset, PortfolioSummary, Order, User, AnalyticsSummary } from '../types';
import { api } from '../api/client';
import { OrderTicket } from '../components/OrderTicket';
import { CryptoMarketStrip } from '../components/CryptoMarketStrip';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

interface DashboardProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
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
    <div className="flex flex-col w-full pb-16 space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Robinhood-Style Hero Balance Strip */}
      <section className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 relative overflow-hidden shadow-sm">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-mono text-[10px] font-extrabold tracking-wider uppercase">
                VIRTUAL CAPITAL DESK
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">NSE Live Emulation</span>
            </div>

            <div className="pt-1">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                Total Portfolio Value
              </span>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                ₹{fmtMoney(totalValue)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  isPnlPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isPnlPositive ? 'trending_up' : 'trending_down'}
                </span>
                <span>
                  {isPnlPositive ? '+' : ''}₹{fmtMoney(unrealizedPnl)} ({fmtPct(unrealizedPct)}%)
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Cash: <strong className="text-slate-900 font-mono">₹{fmtMoney(cash)}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/markets"
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Trade Equities</span>
            </Link>

            <Link
              to="/portfolio"
              className="px-5 py-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">pie_chart</span>
              <span>My Portfolio</span>
            </Link>

            {!user && (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Robinhood-Style Equity Curve */}
        <div className="relative w-full h-56 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500">Trajectory Performance</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
              {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
            <defs>
              <linearGradient id="neonAreaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="85%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line stroke="#E2E8F0" strokeDasharray="4 4" x1="0" x2="800" y1="50" y2="50" />
            <line stroke="#E2E8F0" strokeDasharray="4 4" x1="0" x2="800" y1="100" y2="100" />
            <line stroke="#E2E8F0" strokeDasharray="4 4" x1="0" x2="800" y1="150" y2="150" />

            {/* Glowing Gradient Area */}
            <polygon
              fill="url(#neonAreaGrad)"
              points="0,150 100,145 220,138 340,118 460,126 580,108 700,98 800,90 800,200 0,200"
            />

            {/* Main Emerald Line */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,150 100,145 220,138 340,118 460,126 580,108 700,98 800,90"
            />

            {/* Active End Dot */}
            <circle cx="800" cy="90" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>
      </section>

      {/* 3 Neo Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Available Cash */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Liquid Cash
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{fmtMoney(cash)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${cashPct}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 font-bold">
                {cashPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Open Holdings */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Equity Holdings
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{fmtMoney(holdingsValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full"
                  style={{ width: `${equityPct}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-mono text-cyan-600 font-bold">
                {equityPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Realized P&L / Win Rate */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Realized P&amp;L
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">insights</span>
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black font-mono ${
                isRealizedPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isRealizedPositive ? '+' : ''}₹{fmtMoney(realizedPnl)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono">
                {analytics?.win_rate_pct != null ? `${analytics.win_rate_pct.toFixed(0)}% Wins` : '0% Wins'}
              </span>
              <span className="text-slate-500 font-mono">
                {analytics?.total_trades ?? recentOrders.length} trades
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Cryptocurrency Public Spot Feed (Binance) */}
      <section>
        <CryptoMarketStrip />
      </section>

      {/* Main Grid: Indian Equities Market & Capital Allocation */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-col: Top Indian Equities (Revolut/Robinhood asset cards) */}
        <div className="lg:col-span-8 bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                NSE High-Liquidity Universe
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulated real-time quote feeds with slippage &amp; STT emulation
              </p>
            </div>
            <Link
              to="/markets"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Full Terminal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {assets.map((asset) => {
              const price = toNum(asset.current_price) || 1000;
              const change = toNum(asset.change_24h);
              const changePct = toNum(asset.change_24h);
              const isPositive = change >= 0;

              return (
                <div
                  key={asset.id}
                  className="bg-slate-50/70 hover:bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-sm"
                  onClick={() => setSelectedAssetForTrade(asset)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-sm text-slate-800 group-hover:border-emerald-500 group-hover:text-emerald-600 shadow-2xs transition-colors">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                          {asset.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssetForTrade(asset);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-slate-950 border border-emerald-200 font-bold text-xs transition-all shadow-2xs"
                    >
                      Trade
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      ₹{fmtMoney(price)}
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isPositive ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                      <span>
                        {isPositive ? '+' : ''}
                        {fmtPct(changePct)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4-col: Capital Allocation Ring & Neo Academy */}
        <div className="lg:col-span-4 space-y-6">
          {/* Capital Ring */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-black text-slate-900">Capital Allocation</h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
                {cashPct.toFixed(0)}% Cash
              </span>
            </div>

            <div className="py-4 flex flex-col items-center justify-center relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" fill="none" r="48" stroke="#F1F5F9" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="#10B981"
                  strokeWidth="10"
                  strokeDasharray="301.6"
                  strokeDashoffset={cashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {cashPct.toFixed(0)}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Liquid
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Virtual Cash</span>
                </div>
                <span className="font-bold text-slate-900">₹{fmtMoney(cash)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span className="text-slate-600">Equities</span>
                </div>
                <span className="font-bold text-slate-900">₹{fmtMoney(holdingsValue)}</span>
              </div>
            </div>
          </div>

          {/* Quick Academy Card */}
          <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white rounded-[28px] border border-emerald-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">We Trade Academy</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Master order routing, stop targets, and brokerage fees before risking real money in live markets.
            </p>
            <Link
              to="/learn"
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore Trading Lessons</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Orders Log */}
      <section className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Simulated Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Execution log &amp; simulated fills</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>All Orders</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((ord) => {
              const isBuy = ord.side === 'BUY';
              const fillPrice = toNum(ord.average_fill_price) || toNum(ord.limit_price);
              return (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] tracking-wider font-mono ${
                        isBuy
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ord.side}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {ord.asset_symbol || 'NSE'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {ord.order_type} • {ord.quantity} shares
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="flex flex-col font-mono">
                      <span className="font-bold text-slate-900">₹{fmtMoney(fillPrice)}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{ord.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            <span className="material-symbols-outlined text-[36px] text-slate-400 mx-auto mb-2 block">
              receipt_long
            </span>
            <p className="font-bold text-slate-800 text-sm">No trades executed yet</p>
            <p className="mt-1 text-slate-500">
              Submit your first order using ₹1,00,000.00 virtual capital with zero risk.
            </p>
            <button
              onClick={() => {
                if (assets.length > 0) setSelectedAssetForTrade(assets[0]);
              }}
              className="mt-4 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
            >
              Place Simulated Order
            </button>
          </div>
        )}
      </section>

      {/* Order Ticket Modal */}
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
