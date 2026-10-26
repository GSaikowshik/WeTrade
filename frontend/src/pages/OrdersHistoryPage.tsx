import React, { useState, useEffect } from 'react';
import { Order, LedgerEntry } from '../types';
import { api } from '../api/client';
import { fmtMoney, toNum } from '../utils/format';

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
    <div className="flex flex-col w-full pb-14 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              Execution Logs
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Audit Trails
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Orders &amp; Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of simulated order states, execution fills, and immutable cash balance entries.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Simulated Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>Cash Ledger ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin mb-3"></div>
            <span>Fetching audit records...</span>
          </div>
        ) : activeTab === 'orders' ? (
          orders.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider h-10">
                    <th className="py-2 px-3 font-semibold">Order ID</th>
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Asset</th>
                    <th className="py-2 px-3 font-semibold">Side</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold text-right">Shares</th>
                    <th className="py-2 px-3 font-semibold text-right">Limit Price</th>
                    <th className="py-2 px-3 font-semibold text-right">Fill Price</th>
                    <th className="py-2 px-3 font-semibold text-right">Fees</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.map((ord) => {
                    const isFilled = ord.status === 'FILLED';
                    const isRejected = ord.status === 'REJECTED';
                    const isPending = ord.status === 'PENDING';
                    const isBuy = ord.side === 'BUY';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400">#{ord.id}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px] font-mono">
                          {new Date(ord.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900 tracking-tight">{ord.asset_symbol}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                              isBuy
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono font-medium">
                          {ord.order_type}
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium text-slate-900 font-mono">
                          {ord.quantity}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-500 font-mono">
                          {ord.limit_price ? `₹${fmtMoney(ord.limit_price)}` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-900 font-mono">
                          {ord.average_fill_price ? `₹${fmtMoney(ord.average_fill_price)}` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-500 font-mono">
                          ₹{fmtMoney(ord.fees_paid)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isFilled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFilled
                                  ? 'bg-emerald-500'
                                  : isRejected
                                  ? 'bg-rose-500'
                                  : isPending
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}
                            ></span>
                            {ord.status}
                          </span>
                          {ord.rejection_reason && (
                            <div className="text-[10px] text-rose-600 mt-1 max-w-xs text-right truncate">
                              {ord.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingId === ord.id}
                              className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
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
            <div className="py-16 text-center text-slate-500 text-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              </div>
              <p className="font-semibold text-slate-800 text-base">No orders placed yet</p>
              <p className="mt-1 text-slate-500 max-w-sm mx-auto">
                Explore the Markets terminal to place your first simulated market or limit order.
              </p>
            </div>
          )
        ) : (
          /* Ledger Table */
          ledger.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider h-10">
                    <th className="py-2 px-3 font-semibold">Entry ID</th>
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Movement Type</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold text-right">Signed Amount</th>
                    <th className="py-2 px-3 font-semibold text-right">Resulting Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ledger.map((entry) => {
                    const amount = toNum(entry.amount);
                    const isCredit = amount >= 0;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400">#{entry.id}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px] font-mono">
                          {new Date(entry.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-semibold uppercase">
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {entry.metadata_json || entry.entry_type}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold">
                          <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                            {isCredit ? '+' : ''}₹{fmtMoney(amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{fmtMoney(entry.resulting_balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-[28px]">account_balance</span>
              </div>
              <p className="font-semibold text-slate-800 text-base">Ledger is empty</p>
              <p className="mt-1 text-slate-500 max-w-sm mx-auto">
                Your initial deposit of ₹1,00,000.00 will appear here upon registration.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
