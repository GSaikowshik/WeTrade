import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Asset, Bar, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { PriceChart } from '../components/PriceChart';
import { OrderTicket } from '../components/OrderTicket';
import { toNum, fmtMoney } from '../utils/format';

interface MarketsProps {
  portfolio: PortfolioSummary | null;
  onRefreshPortfolio: () => void;
}

export const Markets: React.FC<MarketsProps> = ({ portfolio, onRefreshPortfolio }) => {
  const location = useLocation();
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
    // Check URL query param ?search=...
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
              Markets
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
              NSE Equities
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary">Indian Equity Markets</h1>
          <p className="font-body-sm text-body-sm text-text-secondary mt-1">
            Simulated quotes & historical candlestick charts for top NSE equities.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g. RELIANCE)..."
            className="w-full bg-surface-card border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
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
                    ? 'bg-surface-card border-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-surface-card border-border-subtle hover:border-border-strong hover:bg-surface-subtle/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(asset.id);
                    }}
                    className={`p-1 rounded-lg transition ${
                      isWatchlisted
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isWatchlisted ? 'star' : 'star_outline'}
                    </span>
                  </button>
                  <div>
                    <div className="font-semibold text-text-primary text-sm font-numeric-sm">
                      {asset.symbol}
                    </div>
                    <div className="text-[11px] text-text-secondary truncate max-w-[150px]">
                      {asset.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-text-primary text-sm font-numeric-sm [font-feature-settings:'tnum']">
                    {fmtMoney(toNum(asset.current_price))}
                  </div>
                  <div
                    className={`text-xs font-medium [font-feature-settings:'tnum'] ${
                      isUp ? 'text-market-up' : 'text-market-down'
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
            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">{selectedAsset.symbol}</h2>
                  <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded text-text-secondary font-medium">
                    {selectedAsset.exchange}
                  </span>
                  <span className="text-[10px] bg-market-up-subtle text-market-up px-2 py-0.5 rounded font-mono font-semibold">
                    {selectedAsset.data_status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{selectedAsset.name}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderTicket(true)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-medium transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>Place Simulated Order</span>
                </button>
              </div>
            </div>

            {/* 24h Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-card border border-border-subtle rounded-xl p-3 text-xs shadow-sm">
              <div>
                <span className="text-text-secondary block text-[10px]">24h High</span>
                <span className="font-semibold text-text-primary font-numeric-sm [font-feature-settings:'tnum']">
                  {fmtMoney(toNum(selectedAsset.high_24h))}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block text-[10px]">24h Low</span>
                <span className="font-semibold text-text-primary font-numeric-sm [font-feature-settings:'tnum']">
                  {fmtMoney(toNum(selectedAsset.low_24h))}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block text-[10px]">24h Volume</span>
                <span className="font-semibold text-text-primary font-numeric-sm [font-feature-settings:'tnum']">
                  {(toNum(selectedAsset.volume_24h) / 1000000).toFixed(2)}M
                </span>
              </div>
              <div>
                <span className="text-text-secondary block text-[10px]">Data Freshness</span>
                <span className="font-semibold text-text-primary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-market-up" />
                  {selectedAsset.data_status}
                </span>
              </div>
            </div>

            {/* Candlestick & Volume Chart */}
            {loadingBars ? (
              <div className="h-72 w-full flex items-center justify-center bg-surface-card rounded-xl border border-border-subtle text-text-secondary text-xs">
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
          portfolio={portfolio}
          onClose={() => setShowOrderTicket(false)}
          onOrderSubmitted={() => {
            onRefreshPortfolio();
            loadAssets();
          }}
        />
      )}
    </div>
  );
};
export default Markets;
