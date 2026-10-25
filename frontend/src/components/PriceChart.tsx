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
      <div className="h-80 w-full flex items-center justify-center bg-[#0B101E]/80 rounded-3xl border border-white/5 text-slate-500 text-xs">
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
    <div className="glass-card rounded-3xl p-6 flex flex-col space-y-4">
      {/* Chart Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-black text-white tracking-tight">
            {symbol}
          </span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xl font-black text-white">
              ₹{fmtMoney(activeClose)}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                isUpBar
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isUpBar ? '+' : ''}₹{fmtMoney(activeClose - activeOpen)} ({fmtPct(barPctChange)}%)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 pl-3 border-l border-white/10 font-mono">
            <span>O: <strong className="text-white">{fmtMoney(activeOpen)}</strong></span>
            <span>H: <strong className="text-white">{fmtMoney(activeHigh)}</strong></span>
            <span>L: <strong className="text-white">{fmtMoney(activeLow)}</strong></span>
            <span>Vol: <strong className="text-white">{(activeVol / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>

        {/* View Toggle & Intervals */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('candles')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                chartMode === 'candles'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                chartMode === 'line'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">show_chart</span>
              <span>Line</span>
            </button>
          </div>

          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
            {['15m', '1H', '1D'].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onIntervalChange(res)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  interval === res
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Neon Chart Canvas */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + volumeHeight + 25}`}
          className="w-full h-auto min-w-[640px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <filter id="candleGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
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
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - paddingX + 6}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="Geist, monospace"
                >
                  ₹{gridVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator */}
          <line
            x1={paddingX}
            y1={chartHeight}
            x2={chartWidth - paddingX}
            y2={chartHeight}
            stroke="rgba(255, 255, 255, 0.06)"
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
                fill={isUp ? '#00E676' : '#FF385C'}
                opacity="0.3"
              />
            );
          })}

          {/* Candlestick Mode */}
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
              const color = isUp ? '#00E676' : '#FF385C';

              return (
                <g
                  key={`candle-${i}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                >
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1.5"
                    filter="url(#candleGlow)"
                  />
                </g>
              );
            })
          ) : (
            <g>
              <polyline
                fill="none"
                stroke="#00E676"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#candleGlow)"
                points={linePoints}
              />
            </g>
          )}

          {/* Crosshair Hover */}
          {hoverIndex !== null && (
            <line
              x1={paddingX + hoverIndex * candleStep + candleStep / 2}
              y1={10}
              x2={paddingX + hoverIndex * candleStep + candleStep / 2}
              y2={chartHeight + volumeHeight}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Notice */}
      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>We Trade Seeded Feed • Delayed simulated OHLCV data</span>
        </span>
        <span className="text-[11px]">
          {new Date(activeBar.timestamp).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
};
