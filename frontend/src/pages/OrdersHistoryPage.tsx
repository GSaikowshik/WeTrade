import React, { useState, useEffect } from 'react';
import { Order, LedgerEntry } from '../types';
import { api } from '../api/client';
import { History, FileText } from 'lucide-react';

export const OrdersHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'ledger'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await api.getOrders();
        setOrders(res);
      } else {
        const res = await api.getLedger();
        setLedger(res);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId);
      await loadData();
    } catch (err) {
      console.error('Failed to cancel order', err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders & Transaction Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of simulated order states and append-only cash movements.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Orders History ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Immutable Ledger ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading records...</div>
        ) : activeTab === 'orders' ? (
          /* Orders Table */
          orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Submitted At</th>
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Side</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Shares</th>
                    <th className="pb-3 font-medium text-right">Limit Price</th>
                    <th className="pb-3 font-medium text-right">Fill Price</th>
                    <th className="pb-3 font-medium text-right">Fees</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((ord) => {
                    const isFilled = ord.status === 'FILLED';
                    const isRejected = ord.status === 'REJECTED';
                    const isPending = ord.status === 'PENDING';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-mono text-slate-400">#{ord.id}</td>
                        <td className="py-3 text-slate-400">{new Date(ord.created_at).toLocaleString()}</td>
                        <td className="py-3 font-bold text-white">{ord.asset_symbol}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.side === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 font-medium">{ord.order_type}</td>
                        <td className="py-3 text-right font-medium text-slate-200">{ord.quantity}</td>
                        <td className="py-3 text-right text-slate-400">
                          {ord.limit_price ? `₹${ord.limit_price.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          {ord.average_fill_price ? `₹${ord.average_fill_price.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 text-right text-slate-400">₹{ord.fees_paid.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isFilled
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isRejected
                                ? 'bg-rose-500/20 text-rose-400'
                                : isPending
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ord.status}
                          </span>
                          {ord.rejection_reason && (
                            <div className="text-[10px] text-rose-400 mt-0.5 max-w-xs text-right">
                              {ord.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {isPending && (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingId === ord.id}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 transition"
                            >
                              {cancellingId === ord.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">No simulated orders recorded yet.</div>
          )
        ) : (
          /* Ledger Table */
          ledger.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Entry ID</th>
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Associated Order</th>
                    <th className="pb-3 font-medium text-right">Movement Amount</th>
                    <th className="pb-3 font-medium text-right">Resulting Balance</th>
                    <th className="pb-3 font-medium">Audit Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ledger.map((entry) => {
                    const isCredit = entry.amount >= 0;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-mono text-slate-400">#{entry.id}</td>
                        <td className="py-3 text-slate-400">{new Date(entry.created_at).toLocaleString()}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              entry.entry_type === 'DEPOSIT'
                                ? 'bg-blue-500/20 text-blue-400'
                                : entry.entry_type === 'ORDER_BUY'
                                ? 'bg-amber-500/20 text-amber-400'
                                : entry.entry_type === 'ORDER_SELL'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">
                          {entry.order_id ? `#${entry.order_id}` : '—'}
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : ''}₹{entry.amount.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          ₹{entry.resulting_balance.toFixed(2)}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {entry.metadata_json || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">No ledger entries recorded yet.</div>
          )
        )}
      </div>
    </div>
  );
};
