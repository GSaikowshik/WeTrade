import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Asset, Bar, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { PriceChart } from '../components/PriceChart';
import { OrderTicket } from '../components/OrderTicket';
import { CryptoMarketStrip } from '../components/CryptoMarketStrip';
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
  const [marketTab, setMarketTab] = useState<'equities' | 'crypto'>('equities');

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
      {/* Market Category Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Market Terminals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between Indian equities trading simulation and global crypto spot feeds
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMarketTab('equities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              marketTab === 'equities'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">show_chart</span>
            <span>NSE Equities ({assets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketTab('crypto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              marketTab === 'crypto'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">currency_bitcoin</span>
            <span>Binance Crypto (3)</span>
          </button>
        </div>
      </div>

      {marketTab === 'crypto' ? (
        <div className="space-y-6">
          <CryptoMarketStrip />

          {/* Separation Disclosure Card */}
          <div className="bg-amber-50/60 rounded-[28px] p-6 border border-amber-200/80 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Market Separation &amp; Simulation Policy</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cryptocurrency prices displayed here are real-time public spot quotes fetched from Binance for market awareness and cross-asset price study. We Trade's virtual INR wallet, virtual ₹1,00,000 balance, order routing, and portfolio ledger apply strictly to simulated Indian equities (NSE). Cryptocurrency orders and ledger impacts are not supported.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Stock Detail Header */}
          {selectedAsset && (
            <header className="bg-white rounded-[28px] border border-slate-200/90 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-lg text-emerald-700 shadow-2xs">
                {selectedAsset.symbol.slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedAsset.symbol}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600 uppercase">
                    NSE:EQ
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                    {selectedAsset.exchange || 'NSE'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 mt-0.5">
                  {selectedAsset.name} • ISIN: INE{selectedAsset.id}002A01
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

            {/* Price Block */}
            <div className="flex items-baseline gap-3 font-mono">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{fmtMoney(price)}
              </span>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
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
            <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-slate-500 pl-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Day Range</span>
                <span className="text-slate-900 font-semibold">
                  ₹{fmtMoney(dayLow, 1)} – ₹{fmtMoney(dayHigh, 1)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-bold">52W Range</span>
                <span className="text-slate-900 font-semibold">
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
              className={`p-2.5 rounded-full transition-all border ${
                isWatchlisted
                  ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
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
              className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
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
            <div className="h-80 w-full flex items-center justify-center bg-white rounded-[28px] border border-slate-200/90 shadow-sm text-slate-400 text-xs">
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
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">Market Depth (L2 Data)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[9px] font-bold uppercase">
                  Simulated Quotes
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                <span>Buy Vol: <strong className="text-emerald-600">1,48,220</strong></span>
                <span>Sell Vol: <strong className="text-rose-600">1,12,850</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Bids */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1.5 px-3 bg-slate-50 font-mono text-[10px] uppercase text-slate-500 font-bold rounded-xl mb-1 border border-slate-100">
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
                      className="relative grid grid-cols-3 py-1.5 px-3 rounded-lg overflow-hidden bg-slate-50/50 hover:bg-slate-100/60 border border-slate-100/60 transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/10"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-slate-500">{row.orders}</span>
                      <span className="relative z-10 text-right text-slate-700">{row.qty}</span>
                      <span className="relative z-10 text-right text-emerald-600 font-bold">
                        {row.bid}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sell Asks */}
              <div className="flex flex-col">
                <div className="grid grid-cols-3 py-1.5 px-3 bg-slate-50 font-mono text-[10px] uppercase text-slate-500 font-bold rounded-xl mb-1 border border-slate-100">
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
                      className="relative grid grid-cols-3 py-1.5 px-3 rounded-lg overflow-hidden bg-slate-50/50 hover:bg-slate-100/60 border border-slate-100/60 transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-500/10"
                        style={{ width: `${row.fill}%` }}
                      ></div>
                      <span className="relative z-10 text-left text-rose-600 font-bold">
                        {row.ask}
                      </span>
                      <span className="relative z-10 text-right text-slate-700">{row.qty}</span>
                      <span className="relative z-10 text-right text-slate-500">{row.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Fundamentals Snapshot */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-sm font-black text-slate-900">Fundamental Snapshot</span>
              <span className="text-xs font-mono text-slate-500">FY24 Consolidated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  P/E Ratio
                </span>
                <span className="text-base font-bold text-slate-900 block">27.4</span>
                <span className="text-[10px] text-slate-500">Sector: 24.8</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Market Cap
                </span>
                <span className="text-base font-bold text-slate-900 block">₹19.92T</span>
                <span className="text-[10px] text-emerald-600 font-bold">Large Cap</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Beta (1Y)
                </span>
                <span className="text-base font-bold text-slate-900 block">1.05</span>
                <span className="text-[10px] text-slate-500">Moderate</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Book Value
                </span>
                <span className="text-base font-bold text-slate-900 block">
                  ₹{fmtMoney(price * 0.38, 0)}
                </span>
                <span className="text-[10px] text-slate-500">P/B: 2.6</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Tick Size
                </span>
                <span className="text-base font-bold text-slate-900 block">₹0.05</span>
                <span className="text-[10px] text-slate-500">NSE Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-col: Symbols List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-sm font-black text-slate-900">NSE Liquid Equities</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                {filteredAssets.length} Active
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
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
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200/70 hover:border-slate-300 hover:bg-white'
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
                          inWatchlist ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {inWatchlist ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {asset.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right font-mono">
                      <span className="text-xs font-bold text-slate-900">₹{fmtMoney(aPrice)}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          aUp ? 'text-emerald-600' : 'text-rose-600'
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
      {marketTab === 'equities' && showOrderTicket && selectedAsset && (
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
        </>
      )}
    </div>
  );
};
