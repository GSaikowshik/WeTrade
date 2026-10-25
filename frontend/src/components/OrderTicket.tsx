import React, { useState, useId } from 'react';
import { Asset, OrderSide, OrderType, Order, PortfolioSummary } from '../types';
import { api } from '../api/client';
import { toNum, fmtMoney } from '../utils/format';

interface OrderTicketProps {
  asset: Asset;
  availableCash?: number;
  availablePositionQty?: number;
  portfolio?: PortfolioSummary | null;
  onClose: () => void;
  onOrderSuccess?: (order: Order) => void;
  onOrderSubmitted?: () => void;
  onOpenAuth?: () => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  availableCash: propCash,
  availablePositionQty: propQty,
  portfolio,
  onClose,
  onOrderSuccess,
  onOrderSubmitted,
  onOpenAuth,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(toNum(asset.current_price));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Order | null>(null);
  const idempotencyPrefix = useId();

  // Derive cash and owned shares
  const availableCash = propCash !== undefined
    ? propCash
    : toNum(portfolio?.available_cash) || 100000;

  const position = portfolio?.positions?.find(p => p.asset_id === asset.id || p.symbol === asset.symbol);
  const availablePositionQty = propQty !== undefined
    ? propQty
    : (position?.quantity || 0);

  const currentPrice = toNum(asset.current_price);
  const estPrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
  const estimatedNotional = (quantity || 0) * (estPrice || 0);

  // Fee calculation estimation: min(20, 0.03%) + 0.05%
  const brokerage = Math.min(20, estimatedNotional * 0.0003);
  const statutory = estimatedNotional * 0.0005;
  const estimatedFees = brokerage + statutory;

  const totalCost = estimatedNotional + estimatedFees;
  const totalProceeds = Math.max(0, estimatedNotional - estimatedFees);

  const canAffordBuy = availableCash >= totalCost;
  const canSellQty = availablePositionQty >= quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!api.getToken()) {
        if (onOpenAuth) {
          onClose();
          onOpenAuth();
          return;
        }
      }

      const order = await api.submitOrder({
        asset_id: asset.id,
        side,
        order_type: orderType,
        quantity,
        limit_price: orderType === 'LIMIT' ? limitPrice : undefined,
        idempotency_key: `client_${idempotencyPrefix}_${Date.now()}`,
      });

      if (order.status === 'REJECTED') {
        setError(order.rejection_reason || 'Order was rejected by the simulation engine.');
      } else {
        setSuccess(order);
        if (onOrderSuccess) onOrderSuccess(order);
        if (onOrderSubmitted) onOrderSubmitted();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit simulated order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center font-bold text-xs text-text-primary">
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary text-base">{asset.symbol}</span>
                <span className="text-[11px] bg-surface-container-low px-1.5 py-0.5 rounded text-text-secondary font-medium uppercase">
                  {asset.exchange}
                </span>
              </div>
              <p className="text-xs text-text-secondary">{asset.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-subtle transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body-md text-body-md">
          {/* Side Tabs: BUY / SELL */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-subtle rounded-xl">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                side === 'BUY'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                side === 'SELL'
                  ? 'bg-market-down text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Available balances context */}
          <div className="flex justify-between items-center text-xs text-text-secondary px-1">
            <span>
              Available Cash: <strong className="text-text-primary">{fmtMoney(availableCash)}</strong>
            </span>
            <span>
              Owned: <strong className="text-text-primary">{availablePositionQty} shares</strong>
            </span>
          </div>

          {/* Order Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary">Order Execution Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                  orderType === 'MARKET'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border-subtle bg-surface-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Market (Immediate)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                  orderType === 'LIMIT'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border-subtle bg-surface-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Limit (Target Price)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-text-primary">
              <label>Quantity (Shares)</label>
              {side === 'SELL' && availablePositionQty > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(availablePositionQty)}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Max ({availablePositionQty})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Limit Price Input if LIMIT */}
          {orderType === 'LIMIT' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-primary">Limit Price (₹)</label>
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          )}

          {/* Cost & Fee Breakdown Summary */}
          <div className="bg-surface-subtle/70 rounded-xl p-3 border border-border-subtle space-y-2 text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Order Value</span>
              <span className="text-text-primary font-medium">{fmtMoney(estimatedNotional)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span className="flex items-center gap-1">
                Estimated Fees (Brokerage & STT)
              </span>
              <span className="text-text-primary font-medium">{fmtMoney(estimatedFees)}</span>
            </div>
            <div className="pt-2 border-t border-border-subtle flex justify-between font-semibold">
              <span className="text-text-primary">{side === 'BUY' ? 'Total Required Cash' : 'Est. Net Proceeds'}</span>
              <span className={side === 'BUY' ? 'text-text-primary text-sm font-semibold' : 'text-market-up text-sm font-semibold'}>
                {fmtMoney(side === 'BUY' ? totalCost : totalProceeds)}
              </span>
            </div>
          </div>

          {/* Simulation Disclosures */}
          <div className="text-[11px] text-text-secondary bg-surface-container-low p-2.5 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
            <span>
              Simulated order execution with realistic simulated slippage and statutory STT charges.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-market-down-subtle border border-market-down/20 rounded-lg flex items-center gap-2 text-xs text-market-down">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Confirmation */}
          {success && (
            <div className="p-3 bg-market-up-subtle border border-market-up/20 rounded-lg flex items-center gap-2 text-xs text-market-up">
              <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
              <span>
                Order {success.status.toLowerCase()}! Filled at ₹{toNum(success.average_fill_price || success.limit_price || currentPrice).toFixed(2)}.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (side === 'BUY' && !canAffordBuy) || (side === 'SELL' && !canSellQty)}
              className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                side === 'BUY'
                  ? 'bg-primary hover:bg-primary-container text-on-primary disabled:opacity-40 disabled:cursor-not-allowed'
                  : 'bg-market-down hover:opacity-90 text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${quantity} ${asset.symbol}`}
            </button>
            {side === 'BUY' && !canAffordBuy && (
              <p className="text-[11px] text-market-down text-center mt-1.5">
                Insufficient virtual cash for this simulated order.
              </p>
            )}
            {side === 'SELL' && !canSellQty && (
              <p className="text-[11px] text-market-down text-center mt-1.5">
                You do not hold enough shares of {asset.symbol} to sell.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default OrderTicket;
