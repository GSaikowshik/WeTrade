import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp } from 'lucide-react';
import { Asset, Bar, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { PriceChart } from '../components/PriceChart';
import { OrderTicket } from '../components/OrderTicket';
import { toNum } from '../utils/format';

interface MarketsProps {
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
}

export const Markets: React.FC<MarketsProps> = ({ portfolio, onRefreshPortfolio }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (selectedAsset) {
      loadBars(selectedAsset.id, interval);
    }
  }, [selectedAsset, interval]);

  const loadAssets = async () => {
    try {
      const list = await api.getAssets();
      setAssets(list);
      if (list.length > 0 && !selectedAsset) {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Indian Equity Markets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulated quotes & historical candlestick charts for top NSE equities.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g. RELIANCE)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Grid: Asset List & Detailed Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Cards List (1 column) */}
        <div className="space-y-2.5">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAsset?.id === asset.id;
            const isUp = asset.change_24h >= 0;
            const isWatchlisted = watchlistIds.includes(asset.id);

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-blue-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(asset.id);
                    }}
                    className={`p-1 rounded-lg transition ${
                      isWatchlisted
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                  </button>
                  <div>
                    <div className="font-bold text-white text-sm">{asset.symbol}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{asset.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white text-sm">₹{toNum(asset.current_price).toFixed(2)}</div>
                  <div
                    className={`text-xs font-semibold ${
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

        {/* Chart & Asset Details (2 columns) */}
        {selectedAsset && (
          <div className="lg:col-span-2 space-y-5">
            {/* Asset Detail Header with Trade Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">{selectedAsset.symbol}</h2>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                    {selectedAsset.exchange}
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                    {selectedAsset.data_status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAsset.name}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOrderTicket(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Place Simulated Order</span>
                </button>
              </div>
            </div>

            {/* 24h Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">24h High</span>
                <span className="font-semibold text-slate-200">₹{toNum(selectedAsset.high_24h).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">24h Low</span>
                <span className="font-semibold text-slate-200">₹{toNum(selectedAsset.low_24h).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">24h Volume</span>
                <span className="font-semibold text-slate-200">{(toNum(selectedAsset.volume_24h) / 1000000).toFixed(2)}M</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Data Freshness</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {selectedAsset.data_status}
                </span>
              </div>
            </div>

            {/* Candlestick & Volume Chart */}
            {loadingBars ? (
              <div className="h-72 w-full flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                Loading price candles...
              </div>
            ) : (
              <PriceChart
                bars={bars}
                symbol={selectedAsset.symbol}
                currency={selectedAsset.quote_currency}
                interval={interval}
                onIntervalChange={setInterval}
              />
            )}
          </div>
        )}
      </div>

      {/* Order Ticket Modal */}
      {showOrderTicket && selectedAsset && (
        <OrderTicket
          asset={selectedAsset}
          availableCash={portfolio?.available_cash ?? 100000}
          availablePositionQty={
            portfolio?.positions?.find((p) => p.asset_id === selectedAsset.id)?.quantity ?? 0
          }
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
