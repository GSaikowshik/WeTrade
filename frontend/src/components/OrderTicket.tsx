import React, { useState, useId } from 'react';
import { Asset, OrderSide, OrderType, Order, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { fmtMoney, fmtPct, toNum } from '../utils/format';

interface OrderTicketProps {
  asset: Asset;
  availableCash?: number;
  availablePositionQty?: number;
  portfolio?: PortfolioSummary | null;
  onClose: () => void;
  onOrderSuccess?: (order: Order) => void;
  onSuccess?: () => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  availableCash: propCash,
  availablePositionQty: propQty,
  portfolio,
  onClose,
  onOrderSuccess,
  onSuccess,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);

  const price = toNum(asset.current_price) || 1000;
  const change = toNum(asset.change_24h);
  const changePct = toNum(asset.change_24h);
  const isPositive = change >= 0;

  const [limitPrice, setLimitPrice] = useState<number>(price);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Order | null>(null);
  const idempotencyPrefix = useId();

  // Resolve available cash & position quantity
  const availableCash =
    propCash !== undefined
      ? propCash
      : portfolio
      ? toNum(portfolio.available_cash)
      : 100000;

  const availablePositionQty =
    propQty !== undefined
      ? propQty
      : portfolio?.positions?.find((p) => p.asset_id === asset.id)?.quantity ?? 0;

  // Price used for calculation
  const executionPrice = orderType === 'LIMIT' ? limitPrice : price;
  const estimatedNotional = (quantity || 0) * (executionPrice || 0);

  // Fee calculation: min(20, 0.03%) + 0.05%
  const brokerage = Math.min(20, estimatedNotional * 0.0003);
  const statutory = estimatedNotional * 0.0005;
  const estimatedFees = brokerage + statutory;

  const totalRequired = estimatedNotional + estimatedFees;
  const postTradeCash =
    side === 'BUY'
      ? availableCash - totalRequired
      : availableCash + Math.max(0, estimatedNotional - estimatedFees);

  const canAffordBuy = availableCash >= totalRequired;
  const canSellQty = availablePositionQty >= quantity;
  const marginPct = availableCash > 0 ? Math.min(100, (totalRequired / availableCash) * 100) : 0;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleMaxQty = () => {
    if (side === 'BUY') {
      const maxShares = Math.max(1, Math.floor((availableCash - 20) / (executionPrice * 1.0005)));
      setQuantity(maxShares);
    } else {
      setQuantity(Math.max(1, availablePositionQty));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const order = await api.submitOrder({
        asset_id: asset.id,
        side,
        order_type: orderType,
        quantity,
        limit_price: orderType === 'LIMIT' ? limitPrice : undefined,
        idempotency_key: `client_${idempotencyPrefix}_${Date.now()}`,
      });

      if (order.status === 'REJECTED') {
        setError(order.rejection_reason || 'Order was rejected by execution engine.');
      } else {
        setSuccess(order);
        if (onOrderSuccess) onOrderSuccess(order);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="tradingModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-sm text-emerald-700 shadow-2xs">
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">{asset.symbol}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-600">
                  NSE:EQ
                </span>
              </div>
              <div className="text-xs text-slate-500">{asset.name}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Live Price Strip */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-black text-slate-900">₹{fmtMoney(price)}</span>
            <span
              className={`text-xs font-bold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? '+' : ''}₹{fmtMoney(change)} ({fmtPct(changePct)}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Simulated Virtual Funds</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Segmented Buy / Sell Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setSide('BUY');
                setError(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                side === 'BUY'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Buy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('SELL');
                setError(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                side === 'SELL'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Sell</span>
            </button>
          </div>

          {/* Order Type: Market vs Limit */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Order Type</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderType === 'MARKET'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderType === 'LIMIT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Quantity (Shares)</span>
              <span className="text-slate-500 font-mono text-[11px]">
                Holding: {availablePositionQty} •{' '}
                <button
                  type="button"
                  onClick={handleMaxQty}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Max
                </button>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl border border-slate-200 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-11 rounded-2xl bg-slate-50 text-center font-mono text-lg font-bold text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl border border-slate-200 transition-colors"
              >
                +
              </button>
            </div>

            {/* Quick Stepper Chips */}
            <div className="flex items-center gap-1.5">
              {[1, 5, 10, 25, 50].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQuantity(step)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-mono font-semibold text-slate-600 border border-slate-200 transition-colors"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price Input */}
          {orderType === 'LIMIT' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Target Limit Price (₹)</span>
                <span className="text-[10px] text-slate-500 font-mono">NSE Tick: ₹0.05</span>
              </div>
              <input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-2xl bg-slate-50 text-left font-mono text-sm font-bold text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* Cost & Fee Transparency Box */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-500">
              <span>Gross Trade Value</span>
              <span className="text-slate-900 font-bold">₹{fmtMoney(estimatedNotional)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Brokerage (Demo Cap)</span>
              <span className="text-emerald-600 font-bold">₹{fmtMoney(brokerage)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Estimated Fees (STT/GST)</span>
              <span className="text-slate-700">₹{fmtMoney(estimatedFees)}</span>
            </div>
            <div className="h-px bg-slate-200 my-1"></div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-slate-900">
                {side === 'BUY' ? 'Required Margin' : 'Net Proceeds'}
              </span>
              <span className="text-emerald-600">
                ₹{fmtMoney(side === 'BUY' ? totalRequired : Math.max(0, estimatedNotional - estimatedFees))}
              </span>
            </div>
          </div>

          {/* Cash Status Meter */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-500">
              <span>Available Cash</span>
              <span className="text-slate-900 font-bold">₹{fmtMoney(availableCash)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Post-Trade Balance</span>
              <span className="text-emerald-600 font-bold">₹{fmtMoney(postTradeCash)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  side === 'BUY' && !canAffordBuy ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${marginPct}%` }}
              ></div>
            </div>
          </div>

          {/* Validation Errors */}
          {side === 'BUY' && !canAffordBuy && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>Insufficient virtual cash. Required: ₹{fmtMoney(totalRequired)}</span>
            </div>
          )}

          {side === 'SELL' && !canSellQty && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>You do not hold enough shares of {asset.symbol} to sell.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Order executed! Status: {success.status}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Simulated order conformant with NSE tick rules. Zero financial liability.
          </p>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || (side === 'BUY' && !canAffordBuy) || (side === 'SELL' && !canSellQty)}
            className={`w-full py-3.5 rounded-full font-black text-sm tracking-tight transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'BUY'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            <span>
              {loading
                ? 'Simulating Fill...'
                : `${side === 'BUY' ? 'Buy' : 'Sell'} ${quantity} ${asset.symbol}`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );

};
