import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Asset, PortfolioSummary, Order, User, AnalyticsSummary } from '../types';
import { api } from '../api/client';
import { OrderTicket } from '../components/OrderTicket';
import { toNum, fmtMoney } from '../utils/format';

interface DashboardProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
  onOpenAuth: () => void;
}

interface StockDisplayMeta {
  symbol: string;
  name: string;
  defaultPrice: number;
  changeStr: string;
  changePositive: boolean;
  dayRange: string;
  volume: string;
  sparklineD: string;
}

const STOCK_META: Record<string, StockDisplayMeta> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    defaultPrice: 2942.50,
    changeStr: '+₹18.40 (+0.63%)',
    changePositive: true,
    dayRange: '₹2,918.00 - ₹2,955.00',
    volume: '4.8M',
    sparklineD: 'M 0 18 Q 20 20 40 14 T 70 8 T 100 4',
  },
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    defaultPrice: 3890.10,
    changeStr: '-₹12.20 (-0.31%)',
    changePositive: false,
    dayRange: '₹3,865.00 - ₹3,915.00',
    volume: '1.9M',
    sparklineD: 'M 0 6 Q 25 4 50 12 T 80 18 T 100 20',
  },
  INFY: {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    defaultPrice: 1614.80,
    changeStr: '+₹21.00 (+1.32%)',
    changePositive: true,
    dayRange: '₹1,590.00 - ₹1,622.00',
    volume: '6.2M',
    sparklineD: 'M 0 20 Q 30 16 50 10 T 80 6 T 100 2',
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    defaultPrice: 1528.30,
    changeStr: '+₹6.50 (+0.43%)',
    changePositive: true,
    dayRange: '₹1,515.00 - ₹1,536.00',
    volume: '8.1M',
    sparklineD: 'M 0 16 Q 25 18 50 14 T 75 10 T 100 8',
  },
  ICICIBANK: {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    defaultPrice: 1118.90,
    changeStr: '-₹4.80 (-0.43%)',
    changePositive: false,
    dayRange: '₹1,110.00 - ₹1,126.00',
    volume: '5.4M',
    sparklineD: 'M 0 8 Q 20 6 45 12 T 75 16 T 100 18',
  },
  ITC: {
    symbol: 'ITC',
    name: 'ITC Ltd.',
    defaultPrice: 431.25,
    changeStr: '+₹2.10 (+0.49%)',
    changePositive: true,
    dayRange: '₹428.50 - ₹433.00',
    volume: '9.8M',
    sparklineD: 'M 0 14 Q 30 16 55 12 T 80 11 T 100 9',
  },
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  portfolio,
  onRefreshPortfolio,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [_analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedAssetForTrade, setSelectedAssetForTrade] = useState<Asset | null>(null);
  const [chartInterval, setChartInterval] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1D');

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
  const holdingsValue = Math.max(0, totalValue - cash);
  const cashRatio = totalValue > 0 ? Math.min(1, Math.max(0, cash / totalValue)) : 1;
  const cashPct = Math.round(cashRatio * 100);
  const equityPct = 100 - cashPct;

  const unrealizedPnl = toNum(portfolio?.total_unrealized_pnl);
  const unrealizedPct = toNum(portfolio?.total_unrealized_return_pct);
  const hasPositions = Boolean(portfolio?.positions && portfolio.positions.length > 0);

  const circumference = 301.6;
  const strokeDashoffset = circumference * (1 - cashRatio);

  const handleOrderSubmitted = () => {
    onRefreshPortfolio();
    loadDashboardData();
    setSelectedAssetForTrade(null);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Top Workspace Context Strip */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pt-space-md pb-space-lg">
        <div className="flex flex-col max-w-2xl">
          <div className="flex items-center gap-space-xs mb-1.5">
            <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
              Trading Desk
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
              Simulated Environment
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
            Your trading workspace
          </h1>
          <p className="font-body-md text-body-md text-text-secondary mt-1">
            Real-time simulated NSE execution. Zero risk, professional market practice with institutional rigor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-badge-demo-bg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-market-up animate-pulse" />
            <span className="font-label-sm text-label-sm text-badge-demo-text uppercase font-semibold tracking-wider">
              DEMO FEED: 15m DELAYED
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-text-secondary">pie_chart</span>
            <span>View Portfolio</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/markets')}
            className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">travel_explore</span>
            <span>Explore Markets</span>
          </button>
        </div>
      </section>

      {/* Metric Architecture (Top 4-Card Ribbon) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        {/* Card 1 */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Total Portfolio Value
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              account_balance_wallet
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold tracking-tight [font-feature-settings:'tnum']">
              {fmtMoney(totalValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-label-md text-label-md text-text-secondary">
                {hasPositions ? 'Live valuation with open holdings' : 'Starting capital allocated'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Available Virtual Cash
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              payments
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold tracking-tight [font-feature-settings:'tnum']">
              {fmtMoney(cash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-market-up" />
              <span className="font-label-md text-label-md text-market-up font-medium">
                {cashPct}% liquid & unencumbered
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Holdings Market Value
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              stacked_line_chart
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-secondary font-semibold tracking-tight [font-feature-settings:'tnum']">
              {fmtMoney(holdingsValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-label-md text-label-md text-text-tertiary">
                {portfolio?.positions?.length || 0} active open contracts
              </span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Net Realized / Unrealized
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              balance
            </span>
          </div>
          <div className="mt-space-md">
            <div className={`font-numeric-lg text-numeric-lg font-semibold tracking-tight [font-feature-settings:'tnum'] ${
              unrealizedPnl > 0
                ? 'text-market-up'
                : unrealizedPnl < 0
                ? 'text-market-down'
                : 'text-text-primary'
            }`}>
              {unrealizedPnl !== 0
                ? `${unrealizedPnl > 0 ? '+' : ''}${fmtMoney(unrealizedPnl)} (${unrealizedPct > 0 ? '+' : ''}${unrealizedPct.toFixed(2)}%)`
                : '₹0.00 (0.00%)'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-label-md text-label-md text-text-tertiary">
                {hasPositions ? 'Dynamic simulation P&L' : 'Honest baseline (no closed orders)'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Performance & Allocation Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
        {/* Left 8-col: Performance Chart Canvas */}
        <div className="lg:col-span-8 p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Performance Trajectory
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Portfolio valuation against initial simulated deposit
              </p>
            </div>
            <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg self-start sm:self-auto">
              {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setChartInterval(interval)}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm cursor-pointer transition-colors ${
                    chartInterval === interval
                      ? 'bg-surface-card text-text-primary font-semibold shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Simulation Container */}
          <div className="relative w-full h-64 mt-space-sm">
            {/* SVG Grid & Calm Neutral Line */}
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
              <defs>
                <linearGradient id="baselineGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00422d" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#00422d" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Reference Grids */}
              <line stroke="#E5E8E2" strokeDasharray="2 3" strokeWidth="1" x1="50" x2="780" y1="40" y2="40" />
              <line stroke="#D4D4CE" strokeWidth="1" x1="50" x2="780" y1="120" y2="120" />
              <line stroke="#E5E8E2" strokeDasharray="2 3" strokeWidth="1" x1="50" x2="780" y1="200" y2="200" />
              {/* Value Axis Labels */}
              <text className="text-[10px] font-mono select-none" fill="#9CA3AF" textAnchor="end" x="40" y="44">
                ₹1,02,000
              </text>
              <text className="text-[10px] font-mono font-medium select-none" fill="#111827" textAnchor="end" x="40" y="124">
                ₹1,00,000
              </text>
              <text className="text-[10px] font-mono select-none" fill="#9CA3AF" textAnchor="end" x="40" y="204">
                ₹98,000
              </text>
              {/* Baseline Gradient Fill Area */}
              <polygon fill="url(#baselineGrad)" points="50,120 780,120 780,220 50,220" />
              {/* Calm Flat Calibration Baseline */}
              <line stroke="#00422d" strokeLinecap="round" strokeWidth="2" x1="50" x2="520" y1="120" y2="120" />
              {/* Subtle Crosshair & Annotation Anchor */}
              <circle cx="520" cy="120" fill="#00422d" r="4.5" />
              <circle className="animate-ping" cx="520" cy="120" fill="#00422d" fillOpacity="0.2" r="8" />
              <line stroke="#707973" strokeDasharray="2 2" strokeWidth="1" x1="520" x2="520" y1="30" y2="210" />
              {/* Time Markers */}
              <text className="text-[10px] font-mono select-none" fill="#9CA3AF" textAnchor="start" x="50" y="235">
                09:15 NSE
              </text>
              <text className="text-[10px] font-mono select-none" fill="#9CA3AF" textAnchor="middle" x="280" y="235">
                11:30
              </text>
              <text className="text-[10px] font-mono font-medium select-none" fill="#111827" textAnchor="middle" x="520" y="235">
                Current 13:45
              </text>
              <text className="text-[10px] font-mono select-none" fill="#9CA3AF" textAnchor="end" x="770" y="235">
                15:30 Close
              </text>
            </svg>

            {/* Dynamic Tooltip Tag positioned near crosshair */}
            <div className="absolute left-[54%] top-[18%] -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-space-sm py-1.5 rounded-lg shadow-lg pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
                <span className="font-numeric-sm text-numeric-sm font-semibold tracking-tight text-white [font-feature-settings:'tnum']">
                  {fmtMoney(totalValue)}
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-text-tertiary mt-0.5">
                {hasPositions ? 'Live Portfolio • In-Session' : 'Account Created • Day 0 Baseline'}
              </p>
            </div>
          </div>

          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-text-secondary bg-surface-subtle/70 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span className="font-body-sm text-body-sm">
                Baseline calibrated to starting balance. P&L will compute once your first simulated fill is confirmed.
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-mono text-text-tertiary uppercase">
              NSE SIM-FEED V1
            </span>
          </div>
        </div>

        {/* Right 4-col: Portfolio Asset Allocation */}
        <div className="lg:col-span-4 p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Capital Allocation
              </h2>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-secondary">
                {cashPct > 50 ? 'Liquid' : 'Equities'}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Asset deployment across cash & open equities
            </p>
          </div>

          {/* Donut Vector Chart */}
          <div className="py-space-md flex flex-col items-center justify-center relative">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle cx="60" cy="60" fill="none" r="48" stroke="#ECEFEA" strokeWidth="12" />
              {/* Dynamic Cash Ring */}
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="48"
                stroke="#00422d"
                strokeDasharray="301.6"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-numeric-md text-numeric-md font-semibold text-text-primary [font-feature-settings:'tnum']">
                {cashPct}%
              </span>
              <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-widest mt-0.5">
                INR CASH
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="flex flex-col gap-2 pt-space-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="font-body-sm text-body-sm text-text-primary font-medium">
                  Virtual Cash Reserve
                </span>
              </div>
              <div className="text-right">
                <span className="font-numeric-sm text-numeric-sm font-semibold text-text-primary [font-feature-settings:'tnum']">
                  {fmtMoney(cash)}
                </span>
                <span className="font-label-sm text-label-sm text-text-secondary ml-1">
                  ({cashPct}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-high" />
                <span className="font-body-sm text-body-sm text-text-secondary">
                  NSE Equity Exposure
                </span>
              </div>
              <div className="text-right">
                <span className="font-numeric-sm text-numeric-sm text-text-tertiary [font-feature-settings:'tnum']">
                  {fmtMoney(holdingsValue)}
                </span>
                <span className="font-label-sm text-label-sm text-text-tertiary ml-1">
                  ({equityPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-xs">
            <button
              type="button"
              onClick={() => {
                if (assets.length > 0) {
                  setSelectedAssetForTrade(assets[0]);
                } else {
                  navigate('/markets');
                }
              }}
              className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Deploy Virtual Capital</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Market Watchlist & Quick Quotes Table */}
      <section className="rounded-xl bg-surface-card shadow-sm p-space-md mb-space-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Supported NSE Equities
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary font-label-sm text-label-sm font-medium">
                {assets.length || 6} Instruments
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Real-time simulation feed calibrated to Indian standard indices
            </p>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-text-tertiary">
              Feed: Tick-by-tick simulation
            </span>
            <button
              type="button"
              onClick={() => navigate('/markets')}
              className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              title="Tune Feed"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>

        {/* Dense Data Table Container */}
        <div className="overflow-x-auto -mx-space-md px-space-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/80 text-text-secondary font-label-sm text-label-sm uppercase tracking-wider h-9">
                <th className="py-2 px-3 font-semibold rounded-l-md">Symbol & Company</th>
                <th className="py-2 px-3 font-semibold text-right">LTP (₹)</th>
                <th className="py-2 px-3 font-semibold text-right">24h Change</th>
                <th className="py-2 px-3 font-semibold text-right">Day Range (L - H)</th>
                <th className="py-2 px-3 font-semibold text-right">Volume</th>
                <th className="py-2 px-3 font-semibold text-center">7D Trend</th>
                <th className="py-2 px-3 font-semibold text-right rounded-r-md">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm">
              {Object.keys(STOCK_META).map((sym) => {
                const meta = STOCK_META[sym];
                const liveAsset = assets.find((a) => a.symbol === sym);
                const ltp = liveAsset ? toNum(liveAsset.current_price) : meta.defaultPrice;

                return (
                  <tr key={sym} className="hover:bg-surface-subtle/60 transition-colors group">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center font-bold text-[11px] text-text-primary">
                          {sym.slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-numeric-sm text-numeric-sm font-semibold text-text-primary">
                            {sym}
                          </span>
                          <span className="text-text-secondary font-label-sm text-label-sm">
                            {liveAsset?.name || meta.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-numeric-md text-numeric-md font-semibold text-text-primary [font-feature-settings:'tnum']">
                      ₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-numeric-sm text-numeric-sm font-medium [font-feature-settings:'tnum'] ${
                        meta.changePositive
                          ? 'text-market-up bg-market-up-subtle'
                          : 'text-market-down bg-market-down-subtle'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {meta.changePositive ? 'trending_up' : 'trending_down'}
                        </span>
                        <span>{meta.changeStr}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-numeric-sm text-numeric-sm text-text-secondary [font-feature-settings:'tnum']">
                      {meta.dayRange}
                    </td>
                    <td className="py-3 px-3 text-right font-numeric-sm text-numeric-sm text-text-secondary [font-feature-settings:'tnum']">
                      {meta.volume}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <svg className="w-24 h-6 inline-block" viewBox="0 0 100 24">
                        <path
                          d={meta.sparklineD}
                          fill="none"
                          stroke={meta.changePositive ? '#0F766E' : '#B91C1C'}
                          strokeLinecap="round"
                          strokeWidth="1.75"
                        />
                      </svg>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const target: Asset = liveAsset || {
                            id: 0,
                            symbol: sym,
                            name: meta.name,
                            asset_type: 'EQUITY',
                            market: 'EQUITY',
                            exchange: 'NSE',
                            quote_currency: 'INR',
                            current_price: ltp,
                            change_24h: 0,
                            high_24h: ltp,
                            low_24h: ltp,
                            volume_24h: 1000000,
                            data_status: 'SIMULATED',
                            last_updated_at: new Date().toISOString(),
                          };
                          setSelectedAssetForTrade(target);
                        }}
                        className="px-3 py-1 rounded bg-surface-container-low group-hover:bg-primary group-hover:text-on-primary text-text-primary font-label-sm text-label-sm font-medium transition-colors cursor-pointer"
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

      {/* Bottom Asymmetric Grid: Order Ledger & Academy */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left 6-col: Order History / Empty State */}
        <div className="lg:col-span-6 p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Recent Simulated Orders
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Audit log of your intraday & delivery simulation fills
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-text-tertiary uppercase">
              Today
            </span>
          </div>

          {recentOrders.length === 0 ? (
            /* Restrained New Account Empty State */
            <div className="py-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-text-tertiary mb-space-sm">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-text-primary font-medium">
                No trades executed yet
              </h3>
              <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                Simulate your first market or limit order using your ₹1,00,000.00 virtual capital balance with live market depth.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (assets.length > 0) {
                    setSelectedAssetForTrade(assets[0]);
                  } else {
                    navigate('/markets');
                  }
                }}
                className="mt-space-md px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Place Simulated Order</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto divide-y divide-surface-container-low">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      ord.side === 'BUY'
                        ? 'bg-market-up-subtle text-market-up'
                        : 'bg-market-down-subtle text-market-down'
                    }`}>
                      {ord.side}
                    </span>
                    <span className="font-numeric-sm text-numeric-sm font-semibold text-text-primary">
                      {ord.asset_symbol || ord.asset_id}
                    </span>
                    <span className="text-text-secondary text-xs">
                      {ord.quantity} qty • {ord.order_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-numeric-sm text-numeric-sm font-medium text-text-primary">
                      ₹{toNum(ord.average_fill_price || ord.limit_price).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-text-tertiary uppercase">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-space-xs text-center border-t border-surface-container-low">
            <span className="font-label-sm text-label-sm text-text-tertiary">
              All simulated fills conform to actual NSE order matching principles
            </span>
          </div>
        </div>

        {/* Right 6-col: Academy & Trading Readiness */}
        <div className="lg:col-span-6 p-space-md rounded-xl bg-surface-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">
                  We Trade Academy: Paper Trading 101
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                33% COMPLETED
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Core simulation principles before committing real market capital
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container-low rounded-full h-1.5 mt-space-sm mb-space-md">
              <div className="bg-primary h-1.5 rounded-full w-1/3" />
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-space-xs">
              {/* Step 1 */}
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-subtle/50">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-market-up text-[18px]">
                    check_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-medium text-text-secondary line-through">
                      Understanding Market vs Limit Orders
                    </span>
                    <span className="font-label-sm text-label-sm text-text-tertiary">
                      Order execution, slippage, and liquidity spread
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-market-up-subtle text-market-up font-label-sm text-label-sm font-semibold">
                  DONE
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-subtle transition-colors group">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary text-[18px]">
                    radio_button_unchecked
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-medium text-text-primary">
                      Reading Candlestick Charts & Volume
                    </span>
                    <span className="font-label-sm text-label-sm text-text-secondary">
                      Identifying support levels & breakout confirmation
                    </span>
                  </div>
                </div>
                <Link
                  to="/learn"
                  className="px-2.5 py-1 rounded bg-surface-card hover:bg-surface-container text-text-primary font-label-sm text-label-sm shadow-xs border border-border-subtle transition-colors"
                >
                  Read (4m)
                </Link>
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-subtle transition-colors group">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary text-[18px]">
                    radio_button_unchecked
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-medium text-text-primary">
                      Formulating an Entry Thesis & Journaling
                    </span>
                    <span className="font-label-sm text-label-sm text-text-secondary">
                      Risk-to-reward ratio and emotional discipline
                    </span>
                  </div>
                </div>
                <Link
                  to="/learn"
                  className="px-2.5 py-1 rounded bg-surface-card hover:bg-surface-container text-text-primary font-label-sm text-label-sm shadow-xs border border-border-subtle transition-colors"
                >
                  Read (6m)
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Footnote */}
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-text-secondary">
            <span className="font-label-sm text-label-sm">Track insights in your Trade Journal</span>
            <Link
              to="/journal"
              className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1"
            >
              <span>Open Trade Journal</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trade Modal */}
      {selectedAssetForTrade && (
        <OrderTicket
          asset={selectedAssetForTrade}
          portfolio={portfolio}
          onClose={() => setSelectedAssetForTrade(null)}
          onOrderSubmitted={handleOrderSubmitted}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
export default Dashboard;
