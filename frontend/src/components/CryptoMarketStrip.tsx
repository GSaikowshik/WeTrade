import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CryptoTicker } from '../types';
import { api } from '../api/client';

interface CryptoMarketStripProps {
  className?: string;
}

const REFRESH_INTERVAL_MS = 25000; // 25 seconds interval to avoid hammering API
const STALE_THRESHOLD_MS = 75000;  // 75 seconds threshold for stale data warning

const CRYPTO_META: Record<string, { name: string; icon: string; color: string; border: string }> = {
  BTCUSDT: {
    name: 'Bitcoin',
    icon: 'currency_bitcoin',
    color: '#F7931A',
    border: 'rgba(247, 147, 26, 0.3)',
  },
  ETHUSDT: {
    name: 'Ethereum',
    icon: 'token',
    color: '#627EEA',
    border: 'rgba(98, 126, 234, 0.3)',
  },
  SOLUSDT: {
    name: 'Solana',
    icon: 'bolt',
    color: '#14F195',
    border: 'rgba(20, 241, 149, 0.3)',
  },
};

export const CryptoMarketStrip: React.FC<CryptoMarketStripProps> = ({ className = '' }) => {
  const [tickers, setTickers] = useState<CryptoTicker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // In-flight guard to prevent overlapping concurrent requests
  const isFetchingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const fetchTickers = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) {
      setIsRefreshing(true);
    }

    try {
      const data = await api.getCryptoTickers();
      if (!isMountedRef.current) return;
      setTickers(data);
      setError(null);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const msg = err?.message || 'Failed to fetch cryptocurrency market data';
      setError(msg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTickers(false);

    // Set up periodic polling with cleanup on unmount
    const timer = setInterval(() => {
      fetchTickers(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchTickers]);

  const formatFetchTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isDataStale = (isoString: string): boolean => {
    try {
      const age = Date.now() - new Date(isoString).getTime();
      return age > STALE_THRESHOLD_MS;
    } catch {
      return false;
    }
  };

  return (
    <div className={`glass-card rounded-3xl p-6 ${className}`} data-testid="crypto-market-strip">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="material-symbols-outlined text-[20px]">currency_bitcoin</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Global Crypto Spot Prices
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                Public Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reference spot prices from Binance REST API • Read-only observation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Source: Binance Spot</span>
          </span>

          <button
            type="button"
            onClick={() => fetchTickers(true)}
            disabled={isRefreshing || loading}
            aria-label="Refresh crypto prices"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all disabled:opacity-50 active:scale-95"
            title="Refresh crypto prices"
          >
            <span
              className={`material-symbols-outlined text-[18px] block ${
                isRefreshing ? 'animate-spin text-amber-400' : ''
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && tickers.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="crypto-loading-skeleton">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/5 rounded"></div>
              </div>
              <div className="h-7 w-32 bg-white/10 rounded my-2"></div>
              <div className="h-3 w-28 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && tickers.length === 0 && (
        <div
          className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center flex flex-col items-center justify-center gap-3"
          data-testid="crypto-error-state"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <span className="material-symbols-outlined text-[22px]">error</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cryptocurrency Feed Unavailable</h3>
            <p className="text-xs text-rose-300 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchTickers(true)}
            className="px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/30 font-bold text-xs transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tickers.length === 0 && (
        <div
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-slate-500 text-xs"
          data-testid="crypto-empty-state"
        >
          <p className="font-semibold text-white">No cryptocurrency pairs returned</p>
          <p className="mt-1">Supported pairs: BTCUSDT, ETHUSDT, SOLUSDT</p>
        </div>
      )}

      {/* Active Tickers Grid */}
      {tickers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="crypto-tickers-grid">
          {tickers.map((ticker) => {
            const meta = CRYPTO_META[ticker.symbol] || {
              name: ticker.symbol,
              icon: 'paid',
              color: '#38BDF8',
              border: 'rgba(56, 189, 248, 0.3)',
            };
            const stale = isDataStale(ticker.fetched_at);

            return (
              <div
                key={ticker.symbol}
                className="relative p-5 rounded-2xl bg-[#0B101E]/80 border border-white/5 hover:border-white/15 transition-all group overflow-hidden flex flex-col justify-between"
                data-testid={`crypto-card-${ticker.symbol}`}
              >
                {/* Subtle radial glow */}
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: meta.color }}
                ></div>

                {/* Top pair label & status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-inner"
                      style={{
                        backgroundColor: `${meta.color}15`,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-sm tracking-tight block">
                        {ticker.symbol}
                      </span>
                      <span className="text-[10px] text-slate-400">{meta.name}</span>
                    </div>
                  </div>

                  {stale ? (
                    <span
                      className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider"
                      title="Price was fetched more than 75s ago"
                    >
                      Stale
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                      title="Fresh price fetched via backend"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live</span>
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-2xl font-black text-white tracking-tight">
                      ${ticker.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-slate-400 font-bold uppercase">
                      {ticker.quote_currency}
                    </span>
                  </div>
                </div>

                {/* Footer metadata: Fetch timestamp and source */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span title="UTC timestamp when backend fetched this price from Binance">
                    Fetched: {formatFetchTime(ticker.fetched_at)}
                  </span>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold">
                    Spot
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transparent notice adhering to non-fabrication & separation invariants */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <p className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
          <span>
            Prices are public spot quotes polled via Binance REST API. Cryptocurrencies are for market observation only and do not enter the Indian equities order flow.
          </span>
        </p>
        <span className="font-mono text-[10px] text-slate-500 shrink-0">
          Poll: 25s • No streaming claims
        </span>
      </div>
    </div>
  );
};
