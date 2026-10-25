import React, { useState } from 'react';
import { PortfolioSummary, Asset } from '../types';
import { PieChart, Layers } from 'lucide-react';
import { OrderTicket } from '../components/OrderTicket';
import { toNum } from '../utils/format';

interface PortfolioPageProps {
  portfolio: PortfolioSummary | null;
  assets: Asset[];
  onRefreshPortfolio: () => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  portfolio,
  assets,
  onRefreshPortfolio,
}) => {
  const [selectedAssetForTrade, setSelectedAssetForTrade] = useState<Asset | null>(null);

  const totalValue = toNum(portfolio?.total_portfolio_value) || 100000;
  const cash = toNum(portfolio?.available_cash) || 100000;
  const unrealized = toNum(portfolio?.total_unrealized_pnl);
  const unrealizedPct = toNum(portfolio?.total_unrealized_return_pct);
  const realized = toNum(portfolio?.total_realized_pnl);
  const fees = toNum(portfolio?.total_fees_paid);

  const isUnrealizedUp = unrealized >= 0;
  const isRealizedUp = realized >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Virtual Portfolio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Track holdings, average cost basis, market valuation, and P&L calculations.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Total Valuation</span>
          <div className="text-2xl font-bold text-white">
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">Cash + Open Positions</div>
        </div>

        {/* Available Virtual Cash */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Available Practice Funds</span>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {((cash / (totalValue || 1)) * 100).toFixed(1)}% cash allocation
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Unrealized P&L</span>
          <div className={`text-2xl font-bold ${isUnrealizedUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUnrealizedUp ? '+' : ''}₹{unrealized.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-xs mt-2 font-semibold ${isUnrealizedUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUnrealizedUp ? '+' : ''}{unrealizedPct.toFixed(2)}% open gain
          </div>
        </div>

        {/* Realized P&L & Fees */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Realized Net P&L</span>
          <div className={`text-2xl font-bold ${isRealizedUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isRealizedUp ? '+' : ''}₹{realized.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">Total Fees Paid: ₹{fees.toFixed(2)}</div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Open Holdings & Cost Basis</h2>
            <p className="text-xs text-slate-400">
              Positions updated with weighted average cost accounting formula
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
            {portfolio?.positions?.length ?? 0} Active Positions
          </span>
        </div>

        {portfolio?.positions && portfolio.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium text-right">Quantity</th>
                  <th className="pb-3 font-medium text-right">Avg Buy Price</th>
                  <th className="pb-3 font-medium text-right">Cost Basis</th>
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
                      <td className="py-3">
                        <div className="font-bold text-white text-sm">{pos.symbol}</div>
                        <div className="text-[10px] text-slate-500">{pos.name}</div>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-200">{toNum(pos.quantity)}</td>
                      <td className="py-3 text-right text-slate-300">₹{toNum(pos.average_cost).toFixed(2)}</td>
                      <td className="py-3 text-right text-slate-300">₹{toNum(pos.cost_basis).toFixed(2)}</td>
                      <td className="py-3 text-right font-medium text-white">₹{toNum(pos.current_price).toFixed(2)}</td>
                      <td className="py-3 text-right font-bold text-white">₹{toNum(pos.market_value).toFixed(2)}</td>
                      <td className={`py-3 text-right font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div>
                          {isUp ? '+' : ''}₹{posUnrealized.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-normal">
                          {isUp ? '+' : ''}{posReturnPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => matchedAsset && setSelectedAssetForTrade(matchedAsset)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
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
          <div className="py-16 text-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>You currently hold no virtual equity positions.</p>
            <p className="text-slate-600 mt-1">Open positions to track real-time market value and returns.</p>
          </div>
        )}
      </div>

      {/* Asset Allocation Breakdown */}
      {portfolio?.allocations && portfolio.allocations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">Portfolio Allocation</h2>
              <p className="text-xs text-slate-400">Distribution across cash and active holdings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {portfolio.allocations.map((alloc) => (
              <div
                key={alloc.symbol}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">{alloc.symbol}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{alloc.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white text-xs">
                    ₹{alloc.market_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-blue-400 font-bold">{alloc.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
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
          }}
        />
      )}
    </div>
  );
};
