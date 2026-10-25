import React, { useState } from 'react';
import { Bar } from '../types';
import { toNum, fmtMoney } from '../utils/format';

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
  currency = 'INR',
  interval,
  onIntervalChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!bars || bars.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-surface-card rounded-xl border border-border-subtle text-text-secondary">
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

  const chartHeight = 240;
  const volumeHeight = 50;
  const totalHeight = chartHeight + volumeHeight;
  const chartWidth = 720;
  const paddingX = 40;
  const plotWidth = chartWidth - paddingX * 2;
  const candleStep = plotWidth / bars.length;
  const candleWidth = Math.max(candleStep * 0.7, 3);

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

  return (
    <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-text-primary">{symbol}</span>
            <span className="text-sm font-semibold text-text-primary [font-feature-settings:'tnum']">
              {fmtMoney(activeClose)} {currency}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                isUpBar ? 'bg-market-up-subtle text-market-up' : 'bg-market-down-subtle text-market-down'
              }`}
            >
              {isUpBar ? '+' : ''}
              {barPctChange.toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-text-secondary mt-1 flex flex-wrap gap-4 font-mono">
            <span>O: ₹{activeOpen.toFixed(2)}</span>
            <span>H: ₹{activeHigh.toFixed(2)}</span>
            <span>L: ₹{activeLow.toFixed(2)}</span>
            <span>C: ₹{activeClose.toFixed(2)}</span>
            <span>Vol: {(activeVol / 1000).toFixed(1)}k</span>
            <span className="text-text-tertiary">{new Date(activeBar.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Interval controls */}
        <div className="flex bg-surface-subtle rounded-lg p-0.5 border border-border-subtle">
          {['1D', '1H', '15m'].map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => onIntervalChange(res)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                interval === res
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas for Candles + Volume */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Reference Grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight - pct * (chartHeight - 40) - 20;
            const priceLevel = minPrice + pct * priceRange;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  x2={chartWidth - paddingX}
                  y1={y}
                  y2={y}
                  stroke="#E5E8E2"
                  strokeDasharray="2 3"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth - paddingX + 5}
                  y={y + 3}
                  fill="#9CA3AF"
                  fontSize="10"
                  fontFamily="Geist, monospace"
                >
                  ₹{priceLevel.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume baseline */}
          <line
            x1={paddingX}
            x2={chartWidth - paddingX}
            y1={chartHeight}
            y2={chartHeight}
            stroke="#D4D4CE"
            strokeWidth="1"
          />

          {/* Candlesticks */}
          {bars.map((bar, i) => {
            const x = paddingX + i * candleStep + candleStep / 2;
            const o = toNum(bar.open);
            const c = toNum(bar.close);
            const h = toNum(bar.high);
            const l = toNum(bar.low);
            const vol = toNum(bar.volume);

            const isUp = c >= o;
            const color = isUp ? '#0F766E' : '#B91C1C';

            const yHigh = getY(h);
            const yLow = getY(l);
            const yOpen = getY(o);
            const yClose = getY(c);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);

            // Volume bar
            const volBarHeight = (vol / maxVolume) * (volumeHeight - 10);
            const volY = totalHeight - volBarHeight;

            const isHovered = hoverIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-pointer"
              >
                {/* Wick */}
                <line
                  x1={x}
                  x2={x}
                  y1={yHigh}
                  y2={yLow}
                  stroke={color}
                  strokeWidth={isHovered ? '2' : '1.2'}
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

                {/* Volume Bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volBarHeight}
                  fill={isUp ? '#0F766E' : '#B91C1C'}
                  opacity={isHovered ? 0.8 : 0.3}
                  rx="1"
                />

                {/* Vertical hover line indicator */}
                {isHovered && (
                  <line
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={totalHeight}
                    stroke="#707973"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 text-right text-[11px] text-text-tertiary">
        Hover over candle sticks to inspect tick metrics. Real-time simulated feed (We Trade Seeded Feed).
      </div>
    </div>
  );
};
export default PriceChart;
