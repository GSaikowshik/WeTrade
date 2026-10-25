import React, { useState } from 'react';
import { Bar } from '../types';
import { toNum } from '../utils/format';

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
      <div className="h-72 w-full flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
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
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-lg">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white">{symbol}</span>
            <span className="text-sm font-semibold text-slate-300">
              ₹{activeClose.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {currency}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                isUpBar ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isUpBar ? '+' : ''}
              {barPctChange.toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex gap-4">
            <span>O: ₹{activeOpen.toFixed(2)}</span>
            <span>H: ₹{activeHigh.toFixed(2)}</span>
            <span>L: ₹{activeLow.toFixed(2)}</span>
            <span>C: ₹{activeClose.toFixed(2)}</span>
            <span>Vol: {(activeVol / 1000).toFixed(1)}k</span>
            <span className="text-slate-500">{new Date(activeBar.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Interval controls */}
        <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
          {['1D', '1H', '15m'].map((res) => (
            <button
              key={res}
              onClick={() => onIntervalChange(res)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                interval === res
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Candlestick & Volume Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const p = minPrice + priceRange * pct;
            const y = getY(p);
            return (
              <g key={pct}>
                <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                <text x={chartWidth - paddingX + 5} y={y + 4} fill="#64748B" fontSize="10" textAnchor="start">
                  ₹{p.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Volume divider */}
          <line
            x1={paddingX}
            y1={chartHeight}
            x2={chartWidth - paddingX}
            y2={chartHeight}
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* Candlesticks and Volume Bars */}
          {bars.map((bar, i) => {
            const bOpen = toNum(bar.open);
            const bClose = toNum(bar.close);
            const bHigh = toNum(bar.high);
            const bLow = toNum(bar.low);
            const bVol = toNum(bar.volume);

            const xCenter = paddingX + i * candleStep + candleStep / 2;
            const isUp = bClose >= bOpen;
            const color = isUp ? '#10B981' : '#F43F5E';
            const yOpen = getY(bOpen);
            const yClose = getY(bClose);
            const yHigh = getY(bHigh);
            const yLow = getY(bLow);

            const candleTop = Math.min(yOpen, yClose);
            const candleBodyHeight = Math.max(Math.abs(yClose - yOpen), 2);

            // Volume bar
            const volBarHeight = (bVol / maxVolume) * (volumeHeight - 15);
            const volY = totalHeight - volBarHeight;

            const isHovered = hoverIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* Wick */}
                <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.5" />
                {/* Body */}
                <rect
                  x={xCenter - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleBodyHeight}
                  fill={color}
                  rx="1"
                />
                {/* Volume bar */}
                <rect
                  x={xCenter - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volBarHeight}
                  fill={isUp ? '#065F46' : '#881337'}
                  opacity={isHovered ? 0.9 : 0.6}
                />
                {/* Hover indicator crosshair */}
                {isHovered && (
                  <line
                    x1={xCenter}
                    y1={10}
                    x2={xCenter}
                    y2={totalHeight}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>Source: We Trade Seeded Feed (Demo)</span>
        <span>Simulated intraday resolution: {interval}</span>
      </div>
    </div>
  );
};

