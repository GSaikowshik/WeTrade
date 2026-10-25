import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Asset, Bar, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { PriceChart } from '../components/PriceChart';
import { OrderTicket } from '../components/OrderTicket';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

interface MarketsProps {
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
}

export const Markets: React.FC<MarketsProps> = ({ portfolio, onRefreshPortfolio }) => {
  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [interval, setInterval] = useState('1D');
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [showOrderTicket, setShowOrderTicket] = useState(false);
  const [loadingBars, setLoadingBars] = useState(false);

  useEffect(() => {
    loadAssets();
    loadWatchlist();
  }, []);

  const loadAssets = async () => {
    try {
      const list = await api.getAssets();
      setAssets(list);
      const symbolParam = searchParams.get('symbol');
      if (symbolParam) {
        const found = list.find((a) => a.symbol.toUpperCase() === symbolParam.toUpperCase());
        if (found) setSelectedAsset(found);
        else if (list.length > 0) setSelectedAsset(list[0]);
      } else if (list.length > 0 && !selectedAsset) {
        setSelectedAsset(list[0]);
      }
    } catch (err) {
      console.error('Failed to load assets', err);
    }
  };

  const loadWatchlist = async () => {
    try {
      const items = await api.getWatchlist();
      setWatchlistIds(items.map((i) => i.asset_id));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedAsset) {
      loadBars(selectedAsset.id, interval);
    }
  }, [selectedAsset, interval]);

  const loadBars = async (assetId: number, res: string) => {
    setLoadingBars(true);
    try {
      const b = await api.getAssetBars(assetId, res);
      setBars(b);
    } catch (err) {
      console.error('Failed to load bars', err);
    } finally {
      setLoadingBars(false);
    }
  };

  const toggleWatchlist = async (assetId: number) => {
    try {
      if (watchlistIds.includes(assetId)) {
        await api.removeFromWatchlist(assetId);
        setWatchlistIds(watchlistIds.filter((id) => id !== assetId));
      } else {
        await api.addToWatchlist(assetId);
        setWatchlistIds([...watchlistIds, assetId]);
      }
    } catch (err) {
      console.error('Watchlist toggle failed', err);
    }
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const price = selectedAsset
    ? toNum(selectedAsset.current_price) || 1000
    : 1000;
  const change = selectedAsset ? toNum(selectedAsset.change_24h) : 0;
  const changePct = selectedAsset ? toNum(selectedAsset.change_24h) : 0;
  const isPositive = change >= 0;
  const isWatchlisted = selectedAsset ? watchlistIds.includes(selectedAsset.id) : false;

  const dayLow = selectedAsset ? toNum(selectedAsset.low_24h) || price * 0.985 : price * 0.985;
  const dayHigh = selectedAsset ? toNum(selectedAsset.high_24h) || price * 1.015 : price * 1.015;

  return (
    <div className="flex flex-col w-full pb-10 space-y-4 animate-in fade-in duration-150">
      {/* Stock Detail Header - Stitch Template */}
      {selectedAsset && (
        <header className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center font-headline-md text-headline-md text-on-surface font-semibold tracking-tight shadow-2xs">
                {selectedAsset.symbol.slice(0, 1)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-semibold">
                    {selectedAsset.symbol}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-subtle text-text-secondary font-label-sm text-[10px] uppercase font-semibold">
                    NSE : EQ
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-container-low text-text-secondary font-label-sm text-[11px]">
                    {selectedAsset.exchange || 'NSE'}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-text-secondary text-xs">
                  {selectedAsset.name} • ISIN: INE{selectedAsset.id}002A01
                </span>
              </div>
            </div>

            <div className="h-9 w-px bg-surface-container-highest hidden md:block"></div>

            {/* Price Block */}
            <div className="flex items-baseline gap-space-sm">
              <span className="font-numeric-lg text-numeric-lg text-text-primary tracking-tight font-semibold tabular-nums">
                ₹{fmtMoney(price)}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-label-md text-xs font-semibold tabular-nums ${
                  isPositive ? 'bg-market-up-subtle text-market-up' : 'bg-market-down-subtle text-market-down'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isPositive ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span>
                  {isPositive ? '+' : ''}₹{fmtMoney(change)} ({fmtPct(changePct)}%) Today
                </span>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="hidden xl:flex items-center gap-space-md text-text-secondary pl-space-xs text-xs">
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  Day Range
                </span>
                <span className="font-numeric-sm text-text-primary font-medium">
                  ₹{fmtMoney(dayLow, 1)} – ₹{fmtMoney(dayHigh, 1)}
                </span>
              </div>
              <div className="h-6 w-px bg-surface-container-high"></div>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  52W Range
                </span>
                <span className="font-numeric-sm text-text-primary font-medium">
                  ₹{fmtMoney(price * 0.85, 1)} – ₹{fmtMoney(price * 1.25, 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Global Meta & Trade CTA */}
          <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
            <div className="flex flex-col items-start lg:items-end text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-badge-demo-bg text-badge-demo-text font-label-sm text-[10px] uppercase font-semibold">
                  Demo (15m Delay)
                </span>
                <span className="text-text-tertiary font-mono text-[11px]">
                  NSE Intraday
                </span>
              </div>
              <span className="text-market-up font-medium flex items-center gap-1 text-[11px] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-market-up animate-pulse"></span>
                NSE Market Open
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-2">
              <button
                type="button"
                onClick={() => toggleWatchlist(selectedAsset.id)}
                className={`p-2 rounded-lg transition-colors border border-surface-container-high/60 ${
                  isWatchlisted
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-low text-text-secondary hover:bg-surface-container-high'
                }`}
                title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isWatchlisted ? 'bookmark_added' : 'bookmark_add'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowOrderTicket(true)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Simulate Order</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Two-Column Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left 8-col: Terminal (Chart + L2 Order Book + Fundamentals) */}
        <div className="lg:col-span-8 space-y-space-md">
          {/* Price Candlestick Chart */}
          {loadingBars ? (
            <div className="h-72 w-full flex items-center justify-center bg-surface-card rounded-xl border border-surface-container-high text-text-tertiary text-xs">
              Streaming price candles...
            </div>
          ) : selectedAsset ? (
            <PriceChart
              bars={bars}
              symbol={selectedAsset.symbol}
              currency={selectedAsset.quote_currency}
              interval={interval}
              onIntervalChange={setInterval}
            />
          ) : null}

          {/* Market Depth (L2 5-Level Order Book) - Stitch Template */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
            <div className="flex items-center justify-between mb-space-sm pb-2 border-b border-surface-container-low">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-sm text-text-primary font-semibold">
                  Market Depth (L2 Data)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary font-label-sm text-[10px] uppercase font-semibold">
                  Simulated Quotes
                </span>
              </div>
              <div className="flex items-center gap-4 font-label-sm text-xs text-text-secondary">
                <span>
                  Total Buy Qty:{' '}
                  <strong className="text-market-up font-mono">1,48,220</strong>
                </span>
                <span>
                  Total Sell Qty:{' '}
                  <strong className="text-market-down font-mono">1,12,850</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Buy / Bid Depth */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1 px-2 bg-surface-base font-label-sm text-[10px] uppercase text-text-tertiary tracking-wider font-semibold rounded-t">
                  <span>Orders</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Bid (₹)</span>
                </div>
                <div className="divide-y-0 text-xs font-mono">
                  {[
                    { orders: 14, qty: '42,500', bid: (price * 0.9995).toFixed(2), fill: 82 },
                    { orders: 9, qty: '31,240', bid: (price * 0.999).toFixed(2), fill: 65 },
                    { orders: 22, qty: '28,100', bid: (price * 0.9985).toFixed(2), fill: 52 },
                    { orders: 6, qty: '24,380', bid: (price * 0.998).toFixed(2), fill: 44 },
                    { orders: 11, qty: '22,000', bid: (price * 0.9975).toFixed(2), fill: 38 },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 py-1 px-2 hover:bg-surface-container-low transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-market-up/10"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-text-secondary">{row.orders}</span>
                      <span className="relative z-10 text-right text-text-primary">{row.qty}</span>
                      <span className="relative z-10 text-right text-market-up font-medium">
                        {row.bid}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sell / Ask Depth */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1 px-2 bg-surface-base font-label-sm text-[10px] uppercase text-text-tertiary tracking-wider font-semibold rounded-t">
                  <span className="text-left">Ask (₹)</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Orders</span>
                </div>
                <div className="divide-y-0 text-xs font-mono">
                  {[
                    { orders: 16, qty: '38,200', ask: (price * 1.0005).toFixed(2), fill: 74 },
                    { orders: 12, qty: '29,450', ask: (price * 1.001).toFixed(2), fill: 58 },
                    { orders: 18, qty: '21,100', ask: (price * 1.0015).toFixed(2), fill: 42 },
                    { orders: 7, qty: '14,200', ask: (price * 1.002).toFixed(2), fill: 28 },
                    { orders: 15, qty: '9,900', ask: (price * 1.0025).toFixed(2), fill: 20 },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 py-1 px-2 hover:bg-surface-container-low transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-market-down/10"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-left text-market-down font-medium">
                        {row.ask}
                      </span>
                      <span className="relative z-10 text-right text-text-primary">{row.qty}</span>
                      <span className="relative z-10 text-right text-text-secondary">
                        {row.orders}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Snapshot / Fundamentals - Stitch Template */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
            <div className="flex items-center justify-between mb-space-sm pb-2 border-b border-surface-container-low">
              <span className="font-headline-sm text-sm text-text-primary font-semibold">
                Institutional Snapshot
              </span>
              <span className="font-label-sm text-[11px] text-text-tertiary">
                Consolidated Financial Metrics
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-space-md text-xs">
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  P/E Ratio
                </span>
                <span className="font-numeric-md text-text-primary font-semibold tabular-nums mt-0.5">
                  27.4
                </span>
                <span className="text-[11px] text-text-secondary">Ind. Avg: 24.8</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  Market Cap
                </span>
                <span className="font-numeric-md text-text-primary font-semibold tabular-nums mt-0.5">
                  ₹19.92T
                </span>
                <span className="text-[11px] text-text-secondary">Large Cap</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  Beta (1Y)
                </span>
                <span className="font-numeric-md text-text-primary font-semibold tabular-nums mt-0.5">
                  1.05
                </span>
                <span className="text-[11px] text-text-secondary">Moderate</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  Book Value
                </span>
                <span className="font-numeric-md text-text-primary font-semibold tabular-nums mt-0.5">
                  ₹{fmtMoney(price * 0.38, 0)}
                </span>
                <span className="text-[11px] text-text-secondary">P/B: 2.6</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm uppercase tracking-wider text-text-tertiary text-[10px]">
                  Tick Size
                </span>
                <span className="font-numeric-md text-text-primary font-semibold tabular-nums mt-0.5">
                  ₹0.05
                </span>
                <span className="text-[11px] text-text-secondary">NSE Equity Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-col: Stock Search & Instruments List */}
        <div className="lg:col-span-4 space-y-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-low mb-3">
              <span className="font-headline-sm text-sm text-text-primary font-semibold">
                Nifty 50 Active Symbols
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-primary font-semibold">
                {filteredAssets.length} Instruments
              </span>
            </div>

            {/* Search filter input */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined text-[18px] text-text-tertiary absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol (RELIANCE, TCS)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-text-primary placeholder:text-text-tertiary border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Assets List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const aPrice = toNum(asset.current_price) || 1000;
                const aChange = toNum(asset.change_24h);
                const aChangePct = toNum(asset.change_24h);
                const aUp = aChange >= 0;
                const inWatchlist = watchlistIds.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-surface-container-high/60 border-primary shadow-xs'
                        : 'bg-surface-card border-surface-container-low hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset.id);
                        }}
                        className={`p-1 rounded text-text-tertiary hover:text-primary transition-colors ${
                          inWatchlist ? 'text-primary' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {inWatchlist ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-text-primary">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] text-text-secondary truncate max-w-[120px]">
                          {asset.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="font-numeric-sm text-xs font-semibold text-text-primary">
                        ₹{fmtMoney(aPrice)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          aUp ? 'text-market-up' : 'text-market-down'
                        }`}
                      >
                        {aUp ? '+' : ''}
                        {fmtPct(aChangePct)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Order Ticket Modal */}
      {showOrderTicket && selectedAsset && (
        <OrderTicket
          asset={selectedAsset}
          availableCash={portfolio ? toNum(portfolio.available_cash) : 100000}
          availablePositionQty={
            portfolio?.positions?.find((p) => p.asset_id === selectedAsset.id)?.quantity ?? 0
          }
          portfolio={portfolio}
          onClose={() => setShowOrderTicket(false)}
          onOrderSuccess={() => {
            onRefreshPortfolio();
            loadAssets();
          }}
        />
      )}
    </div>
  );
};
