import React, { useState, useId } from 'react';
import { Asset, OrderSide, OrderType, Order } from '../types';
import { api } from '../api/client';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface OrderTicketProps {
  asset: Asset;
  availableCash: number;
  availablePositionQty: number;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  availableCash,
  availablePositionQty,
  onClose,
  onOrderSuccess,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(asset.current_price);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Order | null>(null);
  const idempotencyPrefix = useId();

  // Price used for estimation
  const estPrice = orderType === 'LIMIT' ? limitPrice : asset.current_price;
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
        onOrderSuccess(order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit simulated order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">{asset.symbol}</span>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                {asset.exchange}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{asset.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Side Tabs: BUY / SELL */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Available balances context */}
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>
              Available Cash: <strong className="text-slate-200">₹{availableCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </span>
            <span>
              Owned: <strong className="text-slate-200">{availablePositionQty} shares</strong>
            </span>
          </div>

          {/* Order Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                  orderType === 'MARKET'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                Market (Immediate)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                  orderType === 'LIMIT'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                Limit (Target Price)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <label>Quantity (Shares)</label>
              {side === 'SELL' && availablePositionQty > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(availablePositionQty)}
                  className="text-blue-400 hover:underline"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Limit Price Input if LIMIT */}
          {orderType === 'LIMIT' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Limit Price (₹)</label>
              <input
                type="number"
                min="0.05"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Cost & Fee Breakdown Summary */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Order Value</span>
              <span className="text-slate-200 font-medium">₹{estimatedNotional.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1">
                Estimated Fees
                <span title="Brokerage (₹20 or 0.03%) + 0.05% statutory STT simulation">
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </span>
              </span>
              <span className="text-slate-200 font-medium">₹{estimatedFees.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between font-semibold">
              <span className="text-slate-200">{side === 'BUY' ? 'Total Required Cash' : 'Est. Net Proceeds'}</span>
              <span className={side === 'BUY' ? 'text-white text-sm' : 'text-emerald-400 text-sm'}>
                ₹{(side === 'BUY' ? totalCost : totalProceeds).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Simulation Disclosures */}
          <div className="text-[11px] text-slate-500 bg-slate-800/30 p-2.5 rounded-lg border border-slate-800 flex gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Simulated order. No real money or exchange order is placed. Slippage (0.05%) and statutory fees are simulated for educational fidelity.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Confirmation */}
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                Order {success.status.toLowerCase()}! Fill price: ₹{success.average_fill_price?.toFixed(2) || 'pending'}.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (side === 'BUY' && !canAffordBuy) || (side === 'SELL' && !canSellQty)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-950 disabled:text-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-rose-950 disabled:text-rose-700'
              }`}
            >
              {loading ? 'Processing...' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${quantity} ${asset.symbol}`}
            </button>
            {side === 'BUY' && !canAffordBuy && (
              <p className="text-[11px] text-rose-400 text-center mt-1.5">
                Insufficient cash for this simulated buy order.
              </p>
            )}
            {side === 'SELL' && !canSellQty && (
              <p className="text-[11px] text-rose-400 text-center mt-1.5">
                You do not hold enough shares of {asset.symbol} to sell.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

