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

  // Resolve available cash & quantity
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
  const postTradeCash = side === 'BUY' ? availableCash - totalRequired : availableCash + Math.max(0, estimatedNotional - estimatedFees);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[500px] bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col text-on-surface">
        {/* Modal Top Header */}
        <div className="bg-surface-base px-5 py-4 border-b border-surface-container-high flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-text-primary font-semibold tracking-tight">
                {asset.symbol}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] uppercase font-semibold">
                NSE:EQ
              </span>
              <span className="px-2 py-0.5 rounded bg-badge-demo-bg text-badge-demo-text font-label-sm text-[10px] font-semibold uppercase">
                Paper Trading
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors"
              title="Close Dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-numeric-md text-numeric-md text-text-primary font-bold tabular-nums">
                ₹{fmtMoney(price)}
              </span>
              <span
                className={`font-label-sm text-xs font-semibold tabular-nums ${
                  isPositive ? 'text-market-up' : 'text-market-down'
                }`}
              >
                {isPositive ? '+' : ''}₹{fmtMoney(change)} ({fmtPct(changePct)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-market-up-subtle text-market-up font-label-sm text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-market-up animate-pulse"></span>
              <span>DEMO VIRTUAL FUNDS • ZERO RISK</span>
            </div>
          </div>
          <div className="text-xs text-text-secondary">{asset.name}</div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Order Side Segmented Tabs (Buy vs Sell) */}
          <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-lg gap-1">
            <button
              type="button"
              onClick={() => {
                setSide('BUY');
                setError(null);
              }}
              className={`py-2 rounded-md font-headline-sm text-sm text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
                side === 'BUY'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">south_west</span>
              <span>Buy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('SELL');
                setError(null);
              }}
              className={`py-2 rounded-md font-headline-sm text-sm text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
                side === 'SELL'
                  ? 'bg-market-down text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-market-down hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">north_east</span>
              <span>Sell</span>
            </button>
          </div>

          {/* Product Type & Order Type Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-surface-container-high/60">
              <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-text-primary font-label-sm text-xs font-semibold shadow-2xs">
                CNC (Delivery)
              </span>
            </div>

            <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`px-3 py-1 rounded font-label-sm text-xs font-semibold transition-colors ${
                  orderType === 'MARKET'
                    ? 'bg-surface-container-lowest text-text-primary shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`px-3 py-1 rounded font-label-sm text-xs font-semibold transition-colors ${
                  orderType === 'LIMIT'
                    ? 'bg-surface-container-lowest text-text-primary shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[11px]">
                Quantity (Shares)
              </label>
              <span className="text-text-tertiary">
                Holding: {availablePositionQty} shares •{' '}
                <button
                  type="button"
                  onClick={handleMaxQty}
                  className="text-primary font-semibold hover:underline"
                >
                  Max
                </button>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                className="w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-text-primary flex items-center justify-center font-bold text-lg border border-surface-container-high/60"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-10 rounded-lg bg-surface-container-low text-center font-numeric-md font-semibold text-text-primary border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                className="w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-text-primary flex items-center justify-center font-bold text-lg border border-surface-container-high/60"
              >
                +
              </button>
            </div>

            {/* Quick Increment Steppers */}
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 5, 10, 25, 50].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQuantity(step)}
                  className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-[11px] font-medium text-text-secondary"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price Input if orderType is LIMIT */}
          {orderType === 'LIMIT' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[11px]">
                  Limit Price (₹)
                </label>
                <span className="text-text-tertiary">Tick size: ₹0.05</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-left font-numeric-md font-semibold text-text-primary border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Financial Breakdown Card */}
          <div className="p-3.5 rounded-lg bg-surface-subtle border border-surface-container-high flex flex-col gap-2 font-body-sm text-body-sm text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Trade Gross Value</span>
              <span className="text-text-primary font-mono font-medium">
                ₹{fmtMoney(estimatedNotional)}
              </span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Simulated Brokerage</span>
              <span className="text-market-up font-mono font-medium">
                ₹{fmtMoney(brokerage)} (Demo Cap ₹20)
              </span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Estimated Fees (STT/GST)</span>
              <span className="text-text-primary font-mono font-medium">
                ₹{fmtMoney(estimatedFees)}
              </span>
            </div>
            <div className="h-px bg-surface-container-highest my-0.5"></div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-text-primary">
                {side === 'BUY' ? 'Total Required Margin' : 'Estimated Net Proceeds'}
              </span>
              <span className="text-primary font-numeric-md text-sm font-bold">
                ₹{fmtMoney(side === 'BUY' ? totalRequired : Math.max(0, estimatedNotional - estimatedFees))}
              </span>
            </div>
          </div>

          {/* Account Cash Strip & Margin Meter */}
          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Available Virtual Cash</span>
              <span className="font-mono text-text-primary font-semibold">
                ₹{fmtMoney(availableCash)}
              </span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Balance After Order</span>
              <span className="font-mono text-market-up font-semibold">
                ₹{fmtMoney(postTradeCash)}
              </span>
            </div>
            {/* Visual Margin Meter */}
            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  side === 'BUY' && !canAffordBuy ? 'bg-error' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, marginPct)}%` }}
              ></div>
            </div>
          </div>

          {/* Validation Warnings */}
          {side === 'BUY' && !canAffordBuy && (
            <div className="p-2.5 rounded-lg bg-market-down-subtle border border-market-down/20 text-market-down text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Insufficient virtual cash for this order. Required: ₹{fmtMoney(totalRequired)}</span>
            </div>
          )}

          {side === 'SELL' && !canSellQty && (
            <div className="p-2.5 rounded-lg bg-market-down-subtle border border-market-down/20 text-market-down text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>You do not hold enough shares of {asset.symbol} to sell. Current holding: {availablePositionQty}.</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-market-down-subtle border border-market-down/20 text-market-down text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-lg bg-market-up-subtle border border-market-up/20 text-market-up text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Order executed! Status: {success.status}</span>
            </div>
          )}

          {/* Disclaimer text */}
          <p className="font-label-sm text-[11px] text-text-tertiary leading-relaxed text-center">
            Simulated order conformant with NSE tick rules. No real money or margin liability.
          </p>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || (side === 'BUY' && !canAffordBuy) || (side === 'SELL' && !canSellQty)}
            className={`w-full py-3 rounded-lg font-headline-sm text-sm font-semibold tracking-tight transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'BUY'
                ? 'bg-primary hover:bg-primary-container text-on-primary'
                : 'bg-market-down hover:opacity-90 text-on-primary'
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
