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
    <div className="flex flex-col w-full pb-16 space-y-6 animate-in fade-in duration-150">
      {/* Top Stock Detail Header */}
      {selectedAsset && (
        <header className="glass-card rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-400/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-lg text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                {selectedAsset.symbol.slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {selectedAsset.symbol}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-slate-400 uppercase">
                    NSE:EQ
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    {selectedAsset.exchange || 'NSE'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5">
                  {selectedAsset.name} • ISIN: INE{selectedAsset.id}002A01
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10 hidden md:block"></div>

            {/* Price Block */}
            <div className="flex items-baseline gap-3 font-mono">
              <span className="text-3xl font-black text-white tracking-tight">
                ₹{fmtMoney(price)}
              </span>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                  isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isPositive ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
                <span>
                  {isPositive ? '+' : ''}₹{fmtMoney(change)} ({fmtPct(changePct)}%)
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-slate-400 pl-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-500 font-bold">Day Range</span>
                <span className="text-white font-semibold">
                  ₹{fmtMoney(dayLow, 1)} – ₹{fmtMoney(dayHigh, 1)}
                </span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-500 font-bold">52W Range</span>
                <span className="text-white font-semibold">
                  ₹{fmtMoney(price * 0.85, 1)} – ₹{fmtMoney(price * 1.25, 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleWatchlist(selectedAsset.id)}
              className={`p-2.5 rounded-2xl transition-all border ${
                isWatchlisted
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isWatchlisted ? 'star' : 'star_border'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowOrderTicket(true)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Execute Order</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-col: Terminal View (Chart + L2 Order Book + Fundamentals) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Candlestick / Line Chart */}
          {loadingBars ? (
            <div className="h-80 w-full flex items-center justify-center glass-card rounded-3xl text-slate-500 text-xs">
              Streaming candles...
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

          {/* Market Depth (L2 5-Level Order Book) */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Market Depth (L2 Data)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase">
                  Simulated Quotes
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>Buy Vol: <strong className="text-emerald-400">1,48,220</strong></span>
                <span>Sell Vol: <strong className="text-rose-400">1,12,850</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Bids */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1.5 px-3 bg-white/5 font-mono text-[10px] uppercase text-slate-400 font-bold rounded-xl mb-1">
                  <span>Orders</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Bid (₹)</span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  {[
                    { orders: 14, qty: '42,500', bid: (price * 0.9995).toFixed(2), fill: 82 },
                    { orders: 9, qty: '31,240', bid: (price * 0.999).toFixed(2), fill: 65 },
                    { orders: 22, qty: '28,100', bid: (price * 0.9985).toFixed(2), fill: 52 },
                    { orders: 6, qty: '24,380', bid: (price * 0.998).toFixed(2), fill: 44 },
                    { orders: 11, qty: '22,000', bid: (price * 0.9975).toFixed(2), fill: 38 },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 py-1.5 px-3 rounded-lg overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/15"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-slate-400">{row.orders}</span>
                      <span className="relative z-10 text-right text-slate-200">{row.qty}</span>
                      <span className="relative z-10 text-right text-emerald-400 font-bold">
                        {row.bid}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sell Asks */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1.5 px-3 bg-white/5 font-mono text-[10px] uppercase text-slate-400 font-bold rounded-xl mb-1">
                  <span className="text-left">Ask (₹)</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Orders</span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  {[
                    { orders: 16, qty: '38,200', ask: (price * 1.0005).toFixed(2), fill: 74 },
                    { orders: 12, qty: '29,450', ask: (price * 1.001).toFixed(2), fill: 58 },
                    { orders: 18, qty: '21,100', ask: (price * 1.0015).toFixed(2), fill: 42 },
                    { orders: 7, qty: '14,200', ask: (price * 1.002).toFixed(2), fill: 28 },
                    { orders: 15, qty: '9,900', ask: (price * 1.0025).toFixed(2), fill: 20 },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 py-1.5 px-3 rounded-lg overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-500/15"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-left text-rose-400 font-bold">
                        {row.ask}
                      </span>
                      <span className="relative z-10 text-right text-slate-200">{row.qty}</span>
                      <span className="relative z-10 text-right text-slate-400">{row.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Fundamentals Snapshot */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <span className="text-sm font-black text-white">Fundamental Snapshot</span>
              <span className="text-xs font-mono text-slate-400">FY24 Consolidated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  P/E Ratio
                </span>
                <span className="text-base font-bold text-white block">27.4</span>
                <span className="text-[10px] text-slate-400">Sector: 24.8</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Market Cap
                </span>
                <span className="text-base font-bold text-white block">₹19.92T</span>
                <span className="text-[10px] text-emerald-400">Large Cap</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Beta (1Y)
                </span>
                <span className="text-base font-bold text-white block">1.05</span>
                <span className="text-[10px] text-slate-400">Moderate</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Book Value
                </span>
                <span className="text-base font-bold text-white block">
                  ₹{fmtMoney(price * 0.38, 0)}
                </span>
                <span className="text-[10px] text-slate-400">P/B: 2.6</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Tick Size
                </span>
                <span className="text-base font-bold text-white block">₹0.05</span>
                <span className="text-[10px] text-slate-400">NSE Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-col: Symbols List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <span className="text-sm font-black text-white">NSE Liquid Equities</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                {filteredAssets.length} Active
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined text-slate-500 text-[18px] absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 text-xs text-white placeholder:text-slate-500 border border-white/10 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Instruments stack */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500/15 to-transparent border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-[#0B101E]/80 border-white/5 hover:border-white/15 hover:bg-[#12192E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          inWatchlist ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {inWatchlist ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {asset.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right font-mono">
                      <span className="text-xs font-bold text-white">₹{fmtMoney(aPrice)}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          aUp ? 'text-emerald-400' : 'text-rose-400'
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
