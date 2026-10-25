import React, { useState } from 'react';
import { PortfolioSummary, Asset } from '../types';
import { OrderTicket } from '../components/OrderTicket';
import { toNum, fmtMoney } from '../utils/format';

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
        <div className="flex items-center gap-2 mb-1">
          <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
            Portfolio
          </span>
          <span className="text-text-tertiary">/</span>
          <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
            Virtual Valuation
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-text-primary">Virtual Portfolio</h1>
        <p className="font-body-sm text-body-sm text-text-secondary mt-1">
          Track open holdings, average cost basis, market valuation, and P&L calculations.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <span className="text-xs text-text-secondary block mb-1 uppercase tracking-wider font-label-sm">
            Total Valuation
          </span>
          <div className="font-numeric-lg text-numeric-lg text-text-primary font-semibold [font-feature-settings:'tnum']">
            {fmtMoney(totalValue)}
          </div>
          <div className="text-xs text-text-tertiary mt-2">Cash + Open Positions</div>
        </div>

        {/* Available Virtual Cash */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <span className="text-xs text-text-secondary block mb-1 uppercase tracking-wider font-label-sm">
            Available Virtual Cash
          </span>
          <div className="font-numeric-lg text-numeric-lg text-primary font-semibold [font-feature-settings:'tnum']">
            {fmtMoney(cash)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            {((cash / (totalValue || 1)) * 100).toFixed(1)}% cash allocation
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <span className="text-xs text-text-secondary block mb-1 uppercase tracking-wider font-label-sm">
            Unrealized P&L
          </span>
          <div className={`font-numeric-lg text-numeric-lg font-semibold [font-feature-settings:'tnum'] ${
            isUnrealizedUp ? 'text-market-up' : 'text-market-down'
          }`}>
            {isUnrealizedUp ? '+' : ''}{fmtMoney(unrealized)}
          </div>
          <div className={`text-xs mt-2 font-medium [font-feature-settings:'tnum'] ${
            isUnrealizedUp ? 'text-market-up' : 'text-market-down'
          }`}>
            {isUnrealizedUp ? '+' : ''}{unrealizedPct.toFixed(2)}% open gain
          </div>
        </div>

        {/* Realized P&L & Fees */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <span className="text-xs text-text-secondary block mb-1 uppercase tracking-wider font-label-sm">
            Realized Net P&L
          </span>
          <div className={`font-numeric-lg text-numeric-lg font-semibold [font-feature-settings:'tnum'] ${
            isRealizedUp ? 'text-market-up' : 'text-market-down'
          }`}>
            {isRealizedUp ? '+' : ''}{fmtMoney(realized)}
          </div>
          <div className="text-xs text-text-tertiary mt-2">Total Fees Paid: {fmtMoney(fees)}</div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-primary">
              Open Holdings & Cost Basis
            </h2>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Positions updated with weighted average cost accounting formula
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface">
            {portfolio?.positions?.length ?? 0} Active Positions
          </span>
        </div>

        {portfolio?.positions && portfolio.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-subtle text-text-secondary font-label-sm text-label-sm uppercase tracking-wider h-9">
                  <th className="py-2 px-3 rounded-l-md">Symbol</th>
                  <th className="py-2 px-3 text-right">Shares</th>
                  <th className="py-2 px-3 text-right">Avg Cost</th>
                  <th className="py-2 px-3 text-right">Current Price</th>
                  <th className="py-2 px-3 text-right">Market Value</th>
                  <th className="py-2 px-3 text-right">Unrealized P&L</th>
                  <th className="py-2 px-3 text-right rounded-r-md">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {portfolio.positions.map((pos) => {
                  const pnl = toNum(pos.unrealized_pnl);
                  const pnlPct = toNum(pos.unrealized_return_pct);
                  const isUp = pnl >= 0;
                  const matchingAsset = assets.find((a) => a.id === pos.asset_id || a.symbol === pos.symbol);

                  return (
                    <tr key={pos.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-primary font-numeric-sm">{pos.symbol}</div>
                        <div className="text-[11px] text-text-secondary">{matchingAsset?.name || 'Equity'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary">
                        {pos.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-secondary">
                        {fmtMoney(toNum(pos.average_cost))}
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary font-medium">
                        {fmtMoney(toNum(pos.current_price))}
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary font-semibold">
                        {fmtMoney(toNum(pos.market_value))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className={`font-numeric-sm font-semibold [font-feature-settings:'tnum'] ${
                          isUp ? 'text-market-up' : 'text-market-down'
                        }`}>
                          {isUp ? '+' : ''}{fmtMoney(pnl)}
                        </div>
                        <div className={`text-[11px] font-medium [font-feature-settings:'tnum'] ${
                          isUp ? 'text-market-up' : 'text-market-down'
                        }`}>
                          {isUp ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {matchingAsset && (
                          <button
                            type="button"
                            onClick={() => setSelectedAssetForTrade(matchingAsset)}
                            className="px-3 py-1 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-text-primary text-xs font-medium transition cursor-pointer"
                          >
                            Trade
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-text-secondary">
            <span className="material-symbols-outlined text-[32px] text-text-tertiary mb-2 block">
              pie_chart
            </span>
            <p className="font-semibold text-text-primary">No open holdings yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Execute simulated buy orders from the Markets desk to build your portfolio.
            </p>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {selectedAssetForTrade && (
        <OrderTicket
          asset={selectedAssetForTrade}
          portfolio={portfolio}
          onClose={() => setSelectedAssetForTrade(null)}
          onOrderSubmitted={() => {
            onRefreshPortfolio();
            setSelectedAssetForTrade(null);
          }}
        />
      )}
    </div>
  );
};
export default PortfolioPage;
