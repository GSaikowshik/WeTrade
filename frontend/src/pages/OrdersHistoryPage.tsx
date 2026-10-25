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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00E676] font-semibold">
              Execution Logs
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Audit Trails
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Orders &amp; Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of simulated order states, execution fills, and immutable cash balance entries.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-[#111726] p-1 rounded-xl border border-white/10 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-[#00E676] text-black shadow-glow-green font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Simulated Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-[#00E676] text-black shadow-glow-green font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>Cash Ledger ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#00E676]/30 border-t-[#00E676] animate-spin mb-3"></div>
            <span>Fetching audit records...</span>
          </div>
        ) : activeTab === 'orders' ? (
          orders.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono text-slate-400 uppercase tracking-wider h-10">
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
                <tbody className="divide-y divide-white/5 text-xs">
                  {orders.map((ord) => {
                    const isFilled = ord.status === 'FILLED';
                    const isRejected = ord.status === 'REJECTED';
                    const isPending = ord.status === 'PENDING';
                    const isBuy = ord.side === 'BUY';

                    return (
                      <tr key={ord.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400">#{ord.id}</td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                          {new Date(ord.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white tracking-tight">{ord.asset_symbol}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                              isBuy
                                ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                                : 'bg-[#FF385C]/15 text-[#FF385C] border border-[#FF385C]/30'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 font-mono font-medium">
                          {ord.order_type}
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium text-white font-mono">
                          {ord.quantity}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                          {ord.limit_price ? `₹${fmtMoney(ord.limit_price)}` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-white font-mono">
                          {ord.average_fill_price ? `₹${fmtMoney(ord.average_fill_price)}` : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                          ₹{fmtMoney(ord.fees_paid)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isFilled
                                ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/25'
                                : isRejected
                                ? 'bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/25'
                                : isPending
                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/25'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFilled
                                  ? 'bg-[#00E676]'
                                  : isRejected
                                  ? 'bg-[#FF385C]'
                                  : isPending
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-slate-400'
                              }`}
                            ></span>
                            {ord.status}
                          </span>
                          {ord.rejection_reason && (
                            <div className="text-[10px] text-[#FF385C] mt-1 max-w-xs text-right truncate">
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
                              className="px-3 py-1 rounded-lg bg-[#FF385C]/15 hover:bg-[#FF385C] text-[#FF385C] hover:text-white border border-[#FF385C]/30 text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
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
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              </div>
              <p className="font-semibold text-white text-base">No orders placed yet</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
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
                  <tr className="border-b border-white/10 text-[11px] font-mono text-slate-400 uppercase tracking-wider h-10">
                    <th className="py-2 px-3 font-semibold">Entry ID</th>
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Movement Type</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold text-right">Signed Amount</th>
                    <th className="py-2 px-3 font-semibold text-right">Resulting Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {ledger.map((entry) => {
                    const amount = toNum(entry.amount);
                    const isCredit = amount >= 0;

                    return (
                      <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400">#{entry.id}</td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                          {new Date(entry.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono font-semibold uppercase">
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {entry.metadata_json || entry.entry_type}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold">
                          <span className={isCredit ? 'text-[#00E676]' : 'text-[#FF385C]'}>
                            {isCredit ? '+' : ''}₹{fmtMoney(amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
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
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-[28px]">account_balance</span>
              </div>
              <p className="font-semibold text-white text-base">Ledger is empty</p>
              <p className="mt-1 text-slate-400 max-w-sm mx-auto">
                Your initial deposit of ₹1,00,000.00 will appear here upon registration.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
