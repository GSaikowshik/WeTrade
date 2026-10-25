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

  return (
    <div className="flex flex-col w-full pb-10 space-y-space-lg animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-semibold tracking-wider">
              Asset Ledger
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-[11px] text-text-secondary uppercase tracking-wider">
              Holdings &amp; Valuation
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold text-text-primary tracking-tight">
            Virtual Portfolio
          </h1>
          <p className="font-body-sm text-body-sm text-text-secondary text-xs mt-1">
            Real-time weighted average cost basis, unrealized capital gains, and allocation models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-badge-demo-bg border border-surface-container-high/60 text-xs font-semibold text-badge-demo-text uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-market-up animate-pulse"></span>
            <span>Simulated Capital</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Total Portfolio Value */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span className="font-label-sm uppercase tracking-wider text-[11px]">
              Total Portfolio Net Worth
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              account_balance_wallet
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold tracking-tight">
              ₹{fmtMoney(totalValue)}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Cash (₹{fmtMoney(cash)}) + Equities (₹{fmtMoney(holdingsValue)})
            </div>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span className="font-label-sm uppercase tracking-wider text-[11px]">
              Available Virtual Cash
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              payments
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-numeric-lg text-numeric-lg text-primary font-semibold tracking-tight">
              ₹{fmtMoney(cash)}
            </div>
            <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-market-up"></span>
              <span>{((cash / (totalValue || 1)) * 100).toFixed(0)}% liquidity ratio</span>
            </div>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span className="font-label-sm uppercase tracking-wider text-[11px]">
              Total Unrealized Gain / Loss
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              trending_up
            </span>
          </div>
          <div className="mt-space-md">
            <div
              className={`font-numeric-lg text-numeric-lg font-semibold tracking-tight ${
                isUnrealizedUp ? 'text-market-up' : 'text-market-down'
              }`}
            >
              {isUnrealizedUp ? '+' : ''}₹{fmtMoney(unrealized)}
            </div>
            <div className="text-xs mt-1 flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  isUnrealizedUp
                    ? 'bg-market-up-subtle text-market-up'
                    : 'bg-market-down-subtle text-market-down'
                }`}
              >
                {isUnrealizedUp ? '+' : ''}
                {fmtPct(unrealizedPct)}%
              </span>
              <span className="text-text-tertiary text-[11px]">open positions mark</span>
            </div>
          </div>
        </div>

        {/* Realized P&L & Fees */}
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span className="font-label-sm uppercase tracking-wider text-[11px]">
              Realized Net P&amp;L
            </span>
            <span className="material-symbols-outlined text-[18px] text-text-tertiary">
              receipt
            </span>
          </div>
          <div className="mt-space-md">
            <div
              className={`font-numeric-lg text-numeric-lg font-semibold tracking-tight ${
                isRealizedUp ? 'text-market-up' : 'text-market-down'
              }`}
            >
              {isRealizedUp ? '+' : ''}₹{fmtMoney(realized)}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Total Brokerage &amp; Taxes Paid: ₹{fmtMoney(fees)}
            </div>
          </div>
        </div>
      </div>

      {/* Open Holdings Table */}
      <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
        <div className="flex items-center justify-between mb-space-md pb-space-sm border-b border-surface-container-low">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
              Open Holdings &amp; Cost Basis
            </h2>
            <p className="font-body-sm text-body-sm text-text-secondary text-xs">
              Positions updated using strict weighted-average cost accounting
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle text-text-secondary border border-border-subtle">
            {portfolio?.positions?.length ?? 0} Active Positions
          </span>
        </div>

        {portfolio?.positions && portfolio.positions.length > 0 ? (
          <div className="overflow-x-auto -mx-space-md px-space-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle/80 text-text-secondary font-label-sm text-[11px] uppercase tracking-wider h-9">
                  <th className="py-2 px-3 font-semibold rounded-l-md">Asset &amp; Company</th>
                  <th className="py-2 px-3 font-semibold text-right">Quantity</th>
                  <th className="py-2 px-3 font-semibold text-right">Avg Buy Price</th>
                  <th className="py-2 px-3 font-semibold text-right">Cost Basis</th>
                  <th className="py-2 px-3 font-semibold text-right">Current Price</th>
                  <th className="py-2 px-3 font-semibold text-right">Market Value</th>
                  <th className="py-2 px-3 font-semibold text-right">Unrealized P&amp;L</th>
                  <th className="py-2 px-3 font-semibold text-right rounded-r-md">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-xs">
                {portfolio.positions.map((pos) => {
                  const posUnrealized = toNum(pos.unrealized_pnl);
                  const posReturnPct = toNum(pos.unrealized_return_pct);
                  const isUp = posUnrealized >= 0;
                  const matchedAsset = assets.find((a) => a.id === pos.asset_id);

                  return (
                    <tr key={pos.id} className="hover:bg-surface-subtle/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center font-bold text-[11px] text-text-primary shadow-2xs">
                            {pos.symbol.slice(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary text-sm">
                              {pos.symbol}
                            </span>
                            <span className="text-[11px] text-text-secondary">{pos.name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-text-primary">
                        {toNum(pos.quantity)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-text-secondary">
                        ₹{fmtMoney(pos.average_cost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-text-secondary">
                        ₹{fmtMoney(pos.cost_basis)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-text-primary">
                        ₹{fmtMoney(pos.current_price)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-text-primary">
                        ₹{fmtMoney(pos.market_value)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className={`font-semibold ${isUp ? 'text-market-up' : 'text-market-down'}`}>
                          {isUp ? '+' : ''}₹{fmtMoney(posUnrealized)}
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            isUp ? 'text-market-up' : 'text-market-down'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {fmtPct(posReturnPct)}%
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => matchedAsset && setSelectedAssetForTrade(matchedAsset)}
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
        ) : (
          <div className="py-12 text-center text-text-tertiary text-xs">
            <span className="material-symbols-outlined text-[32px] text-text-tertiary mx-auto mb-2 block">
              pie_chart
            </span>
            <p className="font-medium text-text-secondary text-sm">No active equity positions</p>
            <p className="mt-1">
              Use your ₹1,00,000.00 virtual cash to buy shares from the Markets tab.
            </p>
          </div>
        )}
      </div>

      {/* Asset Allocation Breakdown */}
      {portfolio?.allocations && portfolio.allocations.length > 0 && (
        <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 space-y-4">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-low">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                Portfolio Allocation Model
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary text-xs">
                Asset diversification across cash reserves and active equities
              </p>
            </div>
            <span className="font-label-sm text-[11px] text-primary font-semibold uppercase">
              Capital Exposure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-sm">
            {portfolio.allocations.map((alloc) => (
              <div
                key={alloc.symbol}
                className="bg-surface-container-low p-3 rounded-lg border border-surface-container-high/60 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-text-primary text-xs">{alloc.symbol}</div>
                  <div className="text-[10px] text-text-secondary truncate max-w-[120px]">
                    {alloc.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text-primary text-xs">
                    ₹{fmtMoney(alloc.market_value, 0)}
                  </div>
                  <div className="text-[10px] text-primary font-bold">
                    {alloc.percentage.toFixed(1)}%
                  </div>
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
