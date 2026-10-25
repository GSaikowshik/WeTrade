import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  Clock,
  Sparkles
} from 'lucide-react';
import { Asset, PortfolioSummary, Order, User, AnalyticsSummary } from '../types';
import { api } from '../api/client';
import { OrderTicket } from '../components/OrderTicket';
import { toNum } from '../utils/format';

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
  const unrealizedPnl = toNum(portfolio?.total_unrealized_pnl);
  const unrealizedPct = toNum(portfolio?.total_unrealized_return_pct);
  const isPnlPositive = unrealizedPnl >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome / Simulation Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual Market Environment (NSE Equities)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Practise the markets. Understand your decisions.
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Trade top Indian equities using a real-time ledger with zero financial risk. Master position sizing, stop targets, and order execution before risking real money.
          </p>

          {!user && (
            <div className="mt-5 flex gap-3">
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <span>Claim Starting ₹100,000 Capital</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Portfolio Value</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500">Base Currency: INR</span>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Available Virtual Cash</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Ready for simulated deployment</span>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Unrealized P&L</span>
            {isPnlPositive ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPnlPositive ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Return: </span>
            <strong className={isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}>
              {isPnlPositive ? '+' : ''}{unrealizedPct.toFixed(2)}%
            </strong>
          </div>
        </div>

        {/* Win Rate / Total Trades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Win Rate & Activity</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {analytics ? `${analytics.win_rate_pct.toFixed(1)}%` : '—'}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>{analytics?.total_trades ?? 0} executed trades</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Markets Watchlist & Open Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Current Open Positions</h2>
              <p className="text-xs text-slate-400">Live positions valued at mark price</p>
            </div>
            <Link
              to="/portfolio"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              <span>View Full Portfolio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {portfolio?.positions && portfolio.positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium text-right">Shares</th>
                    <th className="pb-3 font-medium text-right">Avg Cost</th>
                    <th className="pb-3 font-medium text-right">Current Price</th>
                    <th className="pb-3 font-medium text-right">Market Value</th>
                    <th className="pb-3 font-medium text-right">Unrealized P&L</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolio.positions.map((pos) => {
                    const posUnrealized = toNum(pos.unrealized_pnl);
                    const posReturnPct = toNum(pos.unrealized_return_pct);
                    const isUp = posUnrealized >= 0;
                    const matchedAsset = assets.find((a) => a.id === pos.asset_id);
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-white">
                          <div>{pos.symbol}</div>
                          <div className="text-[10px] text-slate-500">{pos.name}</div>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-200">{toNum(pos.quantity)}</td>
                        <td className="py-3 text-right text-slate-300">₹{toNum(pos.average_cost).toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-white">₹{toNum(pos.current_price).toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-white">₹{toNum(pos.market_value).toFixed(2)}</td>
                        <td className={`py-3 text-right font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}₹{posUnrealized.toFixed(2)} ({isUp ? '+' : ''}
                          {posReturnPct.toFixed(2)}%)
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => matchedAsset && setSelectedAssetForTrade(matchedAsset)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
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
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p>You have no active simulated positions.</p>
              <Link
                to="/markets"
                className="mt-3 inline-flex items-center gap-1.5 text-blue-400 hover:underline font-semibold"
              >
                <span>Browse Indian Market Assets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Market Highlights (1 column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Indian Equities</h2>
              <p className="text-xs text-slate-400">Supported NSE Universe</p>
            </div>
            <Link
              to="/markets"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              All Assets
            </Link>
          </div>

          <div className="space-y-2.5">
            {assets.slice(0, 5).map((asset) => {
              const isUp = asset.change_24h >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetForTrade(asset)}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-white text-xs group-hover:text-blue-400 transition">
                      {asset.symbol}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{asset.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white text-xs">₹{toNum(asset.current_price).toFixed(2)}</div>
                    <div
                      className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? '+' : ''}{toNum(asset.change_24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      {user && recentOrders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Order Activity</h2>
              <p className="text-xs text-slate-400">Server validated virtual execution records</p>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              View All History
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Side</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Quantity</th>
                  <th className="pb-3 font-medium text-right">Fill Price</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 font-mono text-slate-400">#{ord.id}</td>
                    <td className="py-2.5 text-slate-500">{new Date(ord.created_at).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-white">{ord.asset_symbol}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ord.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{ord.order_type}</td>
                    <td className="py-2.5 text-right font-medium text-slate-200">{ord.quantity}</td>
                    <td className="py-2.5 text-right font-medium text-white">
                      {ord.average_fill_price ? `₹${ord.average_fill_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ord.status === 'FILLED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ord.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Ticket Modal */}
      {selectedAssetForTrade && (
        <OrderTicket
          asset={selectedAssetForTrade}
          availableCash={portfolio?.available_cash ?? 100000}
          availablePositionQty={
            portfolio?.positions?.find((p) => p.asset_id === selectedAssetForTrade.id)?.quantity ?? 0
          }
          onClose={() => setSelectedAssetForTrade(null)}
          onOrderSuccess={() => {
            onRefreshPortfolio();
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
