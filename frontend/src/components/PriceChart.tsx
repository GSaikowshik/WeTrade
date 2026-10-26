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
      <div className="h-80 w-full flex items-center justify-center bg-white rounded-[28px] border border-slate-200/90 text-slate-400 text-xs shadow-sm">
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
    <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 flex flex-col space-y-4 shadow-sm">
      {/* Chart Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {symbol}
          </span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xl font-black text-slate-900">
              ₹{fmtMoney(activeClose)}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                isUpBar
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isUpBar ? '+' : ''}₹{fmtMoney(activeClose - activeOpen)} ({fmtPct(barPctChange)}%)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 pl-3 border-l border-slate-200 font-mono">
            <span>O: <strong className="text-slate-900">{fmtMoney(activeOpen)}</strong></span>
            <span>H: <strong className="text-slate-900">{fmtMoney(activeHigh)}</strong></span>
            <span>L: <strong className="text-slate-900">{fmtMoney(activeLow)}</strong></span>
            <span>Vol: <strong className="text-slate-900">{(activeVol / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>

        {/* View Toggle & Intervals */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setChartMode('candles')}
              className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                chartMode === 'candles'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">candlestick_chart</span>
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                chartMode === 'line'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">show_chart</span>
              <span>Line</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-mono shadow-2xs">
            {['15m', '1H', '1D'].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onIntervalChange(res)}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  interval === res
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
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
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - paddingX + 6}
                  y={y + 3}
                  fill="#94A3B8"
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
            stroke="#E2E8F0"
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
                fill={isUp ? '#10B981' : '#EF4444'}
                opacity="0.35"
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
              const color = isUp ? '#10B981' : '#EF4444';

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
                  />
                </g>
              );
            })
          ) : (
            <g>
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
              stroke="rgba(0, 0, 0, 0.25)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer Notice */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
