import React, { useState } from 'react';
import { Bar } from '../types';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

interface PriceChartProps {
  bars: Bar[];
  symbol: string;
  currency?: string;
  interval: string;
  onIntervalChange: (interval: string) => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  bars,
  symbol,
  currency: _currency = 'INR',
  interval,
  onIntervalChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');

  if (!bars || bars.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-surface-card rounded-xl border border-surface-container-high text-text-tertiary">
        No price history available for {symbol}.
      </div>
    );
  }

  // Calculate scales
  const prices = bars.flatMap((b) => [toNum(b.open), toNum(b.high), toNum(b.low), toNum(b.close)]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...bars.map((b) => toNum(b.volume)), 1);

  const chartHeight = 260;
  const volumeHeight = 60;
  const chartWidth = 760;
  const paddingX = 40;
  const plotWidth = chartWidth - paddingX * 2;
  const candleStep = plotWidth / bars.length;
  const candleWidth = Math.max(candleStep * 0.7, 4);

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 40) - 20;
  };

  const activeBar = hoverIndex !== null && bars[hoverIndex] ? bars[hoverIndex] : bars[bars.length - 1];
  const activeOpen = toNum(activeBar.open);
  const activeClose = toNum(activeBar.close);
  const activeHigh = toNum(activeBar.high);
  const activeLow = toNum(activeBar.low);
  const activeVol = toNum(activeBar.volume);
  const isUpBar = activeClose >= activeOpen;
  const barPctChange = activeOpen > 0 ? ((activeClose - activeOpen) / activeOpen) * 100 : 0;

  // Polyline points for line chart mode
  const linePoints = bars
    .map((b, i) => {
      const x = paddingX + i * candleStep + candleStep / 2;
      const y = getY(toNum(b.close));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-surface-card rounded-xl border border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-space-md flex flex-col space-y-3">
      {/* Chart Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-low">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="font-headline-sm text-headline-sm font-semibold text-text-primary">
            {symbol}
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-numeric-md font-semibold text-text-primary">
              ₹{fmtMoney(activeClose)}
            </span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                isUpBar ? 'bg-market-up-subtle text-market-up' : 'bg-market-down-subtle text-market-down'
              }`}
            >
              {isUpBar ? '+' : ''}₹{fmtMoney(activeClose - activeOpen)} ({fmtPct(barPctChange)}%)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-text-secondary pl-2 border-l border-surface-container-high">
            <span>O: <strong className="text-text-primary font-mono">{fmtMoney(activeOpen)}</strong></span>
            <span>H: <strong className="text-text-primary font-mono">{fmtMoney(activeHigh)}</strong></span>
            <span>L: <strong className="text-text-primary font-mono">{fmtMoney(activeLow)}</strong></span>
            <span>C: <strong className="text-text-primary font-mono">{fmtMoney(activeClose)}</strong></span>
            <span>Vol: <strong className="text-text-primary font-mono">{(activeVol / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>

        {/* Resolution Selector & Chart View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart mode toggle */}
          <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-surface-container-high/40">
            <button
              type="button"
              onClick={() => setChartMode('candles')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                chartMode === 'candles'
                  ? 'bg-surface-card text-text-primary shadow-2xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                chartMode === 'line'
                  ? 'bg-surface-card text-text-primary shadow-2xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">show_chart</span>
              <span>Line</span>
            </button>
          </div>

          {/* Timeframe intervals */}
          <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-surface-container-high/40">
            {['15m', '1H', '1D'].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onIntervalChange(res)}
                className={`px-2.5 py-0.5 rounded font-label-sm text-xs font-semibold transition-colors ${
                  interval === res
                    ? 'bg-surface-card text-text-primary shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + volumeHeight + 25}`}
          className="w-full h-auto min-w-[640px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="chartLineGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00422d" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#00422d" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const gridVal = minPrice + priceRange * ratio;
            const y = getY(gridVal);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E5E8E2"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth - paddingX + 5}
                  y={y + 3}
                  fill="#9CA3AF"
                  fontSize="10"
                  fontFamily="Geist, monospace"
                >
                  ₹{gridVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Volume separator */}
          <line
            x1={paddingX}
            y1={chartHeight}
            x2={chartWidth - paddingX}
            y2={chartHeight}
            stroke="#E5E8E2"
          />

          {/* Volume Bars */}
          {bars.map((bar, i) => {
            const x = paddingX + i * candleStep + (candleStep - candleWidth) / 2;
            const vol = toNum(bar.volume);
            const vHeight = Math.max((vol / maxVolume) * (volumeHeight - 10), 2);
            const isUp = toNum(bar.close) >= toNum(bar.open);
            return (
              <rect
                key={`vol-${i}`}
                x={x}
                y={chartHeight + volumeHeight - vHeight}
                width={candleWidth}
                height={vHeight}
                fill={isUp ? '#0F766E' : '#B91C1C'}
                opacity="0.35"
              />
            );
          })}

          {/* Candlestick / Line Chart Mode */}
          {chartMode === 'candles' ? (
            bars.map((bar, i) => {
              const x = paddingX + i * candleStep + candleStep / 2;
              const open = toNum(bar.open);
              const close = toNum(bar.close);
              const high = toNum(bar.high);
              const low = toNum(bar.low);
              const isUp = close >= open;

              const yHigh = getY(high);
              const yLow = getY(low);
              const yOpen = getY(open);
              const yClose = getY(close);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
              const candleColor = isUp ? '#0F766E' : '#B91C1C';

              return (
                <g
                  key={`candle-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                >
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={isUp ? '#0F766E' : '#B91C1C'}
                    rx="1"
                  />
                </g>
              );
            })
          ) : (
            <g>
              <polyline
                fill="none"
                stroke="#00422d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <line
              x1={paddingX + hoverIndex * candleStep + candleStep / 2}
              y1={10}
              x2={paddingX + hoverIndex * candleStep + candleStep / 2}
              y2={chartHeight + volumeHeight}
              stroke="#545F73"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Attribution */}
      <div className="pt-2 border-t border-surface-container-low flex flex-col sm:flex-row items-center justify-between text-xs text-text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-market-up"></span>
          <span>We Trade Seeded Feed • Delayed simulated OHLCV data</span>
        </span>
        <span className="text-[11px] font-mono">
          Last candle timestamp: {new Date(activeBar.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
};
