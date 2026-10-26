import React, { useState } from 'react';
import { PortfolioSummary, Asset } from '../types';
import { OrderTicket } from '../components/OrderTicket';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

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
  const holdingsValue = toNum(portfolio?.total_market_value);
  const unrealized = toNum(portfolio?.total_unrealized_pnl);
  const unrealizedPct = toNum(portfolio?.total_unrealized_return_pct);
  const realized = toNum(portfolio?.total_realized_pnl);
  const fees = toNum(portfolio?.total_fees_paid);

  const isUnrealizedUp = unrealized >= 0;
  const isRealizedUp = realized >= 0;
  const cashRatio = Math.min(100, Math.max(0, (cash / (totalValue || 1)) * 100));

  return (
    <div className="flex flex-col w-full pb-14 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              Live Holdings
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Valuation Ledger
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Virtual Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time weighted-average cost basis, mark-to-market unrealized gains, and capital allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Virtual Capital Verified</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="text-[11px] uppercase tracking-wider font-bold">Net Portfolio Worth</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">account_balance_wallet</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
              ₹{fmtMoney(totalValue)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span>Equities: ₹{fmtMoney(holdingsValue)}</span>
              <span className="text-[11px] text-slate-400">Cash: ₹{fmtMoney(cash)}</span>
            </div>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="text-[11px] uppercase tracking-wider font-bold">Available Cash</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
              ₹{fmtMoney(cash)}
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Liquidity Ratio</span>
                <span className="text-slate-900 font-medium">{cashRatio.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${cashRatio}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="text-[11px] uppercase tracking-wider font-bold">Unrealized P&amp;L</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">trending_up</span>
          </div>
          <div className="mt-4">
            <div
              className={`text-3xl font-bold font-mono tracking-tight ${
                isUnrealizedUp ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isUnrealizedUp ? '+' : ''}₹{fmtMoney(unrealized)}
            </div>
            <div className="text-xs mt-2 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isUnrealizedUp
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isUnrealizedUp ? '+' : ''}{fmtPct(unrealizedPct)}%
              </span>
              <span className="text-slate-500 text-[11px]">unbooked mark</span>
            </div>
          </div>
        </div>

        {/* Realized P&L & Fees */}
        <div className="bg-white rounded-[26px] border border-slate-200/90 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="text-[11px] uppercase tracking-wider font-bold">Realized Net P&amp;L</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">receipt</span>
          </div>
          <div className="mt-4">
            <div
              className={`text-3xl font-bold font-mono tracking-tight ${
                isRealizedUp ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isRealizedUp ? '+' : ''}₹{fmtMoney(realized)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Fees &amp; Taxes Paid:</span>
              <span className="font-mono text-slate-700">₹{fmtMoney(fees)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Open Holdings Table */}
      <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Open Positions &amp; Cost Basis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Positions tracked via strict weighted-average cost accounting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              {portfolio?.positions?.length ?? 0} Positions
            </span>
          </div>
        </div>

        {portfolio?.positions && portfolio.positions.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider h-10">
                  <th className="py-2 px-3 font-semibold">Asset</th>
                  <th className="py-2 px-3 font-semibold text-right">Shares</th>
                  <th className="py-2 px-3 font-semibold text-right">Avg Cost</th>
                  <th className="py-2 px-3 font-semibold text-right">Total Basis</th>
                  <th className="py-2 px-3 font-semibold text-right">Mark Price</th>
                  <th className="py-2 px-3 font-semibold text-right">Current Value</th>
                  <th className="py-2 px-3 font-semibold text-right">Unrealized P&amp;L</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {portfolio.positions.map((pos) => {
                  const posUnrealized = toNum(pos.unrealized_pnl);
                  const posReturnPct = toNum(pos.unrealized_return_pct);
                  const isUp = posUnrealized >= 0;
                  const matchedAsset = assets.find((a) => a.id === pos.asset_id);

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs">
                            {pos.symbol.slice(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-emerald-600 transition-colors">
                              {pos.symbol}
                            </span>
                            <span className="text-[11px] text-slate-500">{pos.name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 text-right font-mono font-medium text-slate-900">
                        {toNum(pos.quantity)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono text-slate-700">
                        ₹{fmtMoney(pos.average_cost)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono text-slate-500">
                        ₹{fmtMoney(pos.cost_basis)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono font-medium text-slate-900">
                        ₹{fmtMoney(pos.current_price)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono font-semibold text-slate-900">
                        ₹{fmtMoney(pos.market_value)}
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className={`font-mono font-bold text-sm ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isUp ? '+' : ''}₹{fmtMoney(posUnrealized)}
                        </div>
                        <div
                          className={`text-[10px] font-semibold mt-0.5 ${
                            isUp ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isUp ? '+' : ''}{fmtPct(posReturnPct)}%
                        </div>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => matchedAsset && setSelectedAssetForTrade(matchedAsset)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-500 hover:text-slate-950 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all shadow-2xs active:scale-95"
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
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <span className="material-symbols-outlined text-[28px]">pie_chart</span>
            </div>
            <p className="font-semibold text-slate-800 text-base">No active equity positions</p>
            <p className="mt-1 text-slate-500 max-w-sm mx-auto">
              You have ₹1,00,000.00 virtual cash available to allocate across NSE top equities.
            </p>
          </div>
        )}
      </div>

      {/* Asset Allocation Breakdown */}
      {portfolio?.allocations && portfolio.allocations.length > 0 && (
        <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Capital Diversification Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Relative portfolio weights across cash reserves and active equities
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              Exposure Model
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.allocations.map((alloc) => (
              <div
                key={alloc.symbol}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{alloc.symbol}</span>
                  <span className="font-mono text-xs font-bold text-emerald-600">
                    {alloc.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mb-3">{alloc.name}</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, alloc.percentage)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-right text-xs font-mono text-slate-700 font-semibold">
                  ₹{fmtMoney(alloc.market_value, 0)}
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
          availableCash={portfolio ? toNum(portfolio.available_cash) : 100000}
          availablePositionQty={
            portfolio?.positions?.find((p) => p.asset_id === selectedAssetForTrade.id)?.quantity ?? 0
          }
          portfolio={portfolio}
          onClose={() => setSelectedAssetForTrade(null)}
          onOrderSuccess={() => {
            onRefreshPortfolio();
          }}
        />
      )}
    </div>
  );
};
