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
    <div className="flex flex-col w-full pb-10 space-y-space-lg animate-in fade-in duration-150">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-semibold tracking-wider">
              Execution Engine
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-[11px] text-text-secondary uppercase tracking-wider">
              Audit Trails
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold text-text-primary tracking-tight">
            Orders &amp; Transaction Ledger
          </h1>
          <p className="font-body-sm text-body-sm text-text-secondary text-xs mt-1">
            Complete audit trail of simulated order states, execution fills, and append-only cash movements.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-surface-container-high/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'bg-surface-card text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Simulated Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'ledger'
                ? 'bg-surface-card text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>Immutable Ledger ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
        {loading ? (
          <div className="py-16 text-center text-text-tertiary text-xs">
            Loading audit records...
          </div>
        ) : activeTab === 'orders' ? (
          orders.length > 0 ? (
            <div className="overflow-x-auto -mx-space-md px-space-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-subtle/80 text-text-secondary font-label-sm text-[11px] uppercase tracking-wider h-9">
                    <th className="py-2 px-3 font-semibold rounded-l-md">Order ID</th>
                    <th className="py-2 px-3 font-semibold">Submitted At</th>
                    <th className="py-2 px-3 font-semibold">Asset</th>
                    <th className="py-2 px-3 font-semibold">Side</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold text-right">Shares</th>
                    <th className="py-2 px-3 font-semibold text-right">Limit Price</th>
                    <th className="py-2 px-3 font-semibold text-right">Fill Price</th>
                    <th className="py-2 px-3 font-semibold text-right">Fees</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                    <th className="py-2 px-3 font-semibold text-right rounded-r-md">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-xs">
                  {orders.map((ord) => {
                    const isFilled = ord.status === 'FILLED';
                    const isRejected = ord.status === 'REJECTED';
                    const isPending = ord.status === 'PENDING';
                    const isBuy = ord.side === 'BUY';

                    return (
                      <tr key={ord.id} className="hover:bg-surface-subtle/60 transition-colors">
                        <td className="py-3 px-3 font-mono text-text-tertiary">#{ord.id}</td>
                        <td className="py-3 px-3 text-text-secondary text-[11px]">
                          {new Date(ord.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-text-primary">{ord.asset_symbol}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy
                                ? 'bg-market-up-subtle text-market-up'
                                : 'bg-market-down-subtle text-market-down'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-text-secondary font-medium">
                          {ord.order_type}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-text-primary">
                          {ord.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-text-secondary font-mono">
                          {ord.limit_price ? `₹${fmtMoney(ord.limit_price)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-text-primary font-mono">
                          {ord.average_fill_price ? `₹${fmtMoney(ord.average_fill_price)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-text-secondary font-mono">
                          ₹{fmtMoney(ord.fees_paid)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isFilled
                                ? 'bg-market-up-subtle text-market-up'
                                : isRejected
                                ? 'bg-market-down-subtle text-market-down'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-surface-container-low text-text-secondary'
                            }`}
                          >
                            {ord.status}
                          </span>
                          {ord.rejection_reason && (
                            <div className="text-[10px] text-market-down mt-0.5 max-w-xs text-right">
                              {ord.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingId === ord.id}
                              className="px-2.5 py-1 rounded bg-market-down-subtle hover:bg-market-down text-market-down hover:text-white font-label-sm text-xs font-semibold transition-all disabled:opacity-50"
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
            <div className="py-12 text-center text-text-tertiary text-xs">
              <span className="material-symbols-outlined text-[32px] text-text-tertiary mx-auto mb-2 block">
                receipt_long
              </span>
              <p className="font-medium text-text-secondary text-sm">No orders placed yet</p>
              <p className="mt-1">
                Explore the Markets terminal to place your first simulated market or limit order.
              </p>
            </div>
          )
        ) : (
          /* Ledger Table */
          ledger.length > 0 ? (
            <div className="overflow-x-auto -mx-space-md px-space-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-subtle/80 text-text-secondary font-label-sm text-[11px] uppercase tracking-wider h-9">
                    <th className="py-2 px-3 font-semibold rounded-l-md">Entry ID</th>
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Movement Type</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold text-right">Signed Amount</th>
                    <th className="py-2 px-3 font-semibold text-right rounded-r-md">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-xs">
                  {ledger.map((entry) => {
                    const amount = toNum(entry.amount);
                    const isCredit = amount >= 0;

                    return (
                      <tr key={entry.id} className="hover:bg-surface-subtle/60 transition-colors">
                        <td className="py-3 px-3 font-mono text-text-tertiary">#{entry.id}</td>
                        <td className="py-3 px-3 text-text-secondary text-[11px]">
                          {new Date(entry.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-surface-container-low text-text-primary text-[10px] font-semibold uppercase">
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-text-secondary">
                          {entry.metadata_json || entry.entry_type}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          <span className={isCredit ? 'text-market-up' : 'text-market-down'}>
                            {isCredit ? '+' : ''}₹{fmtMoney(amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-text-primary">
                          ₹{fmtMoney(entry.resulting_balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-text-tertiary text-xs">
              <span className="material-symbols-outlined text-[32px] text-text-tertiary mx-auto mb-2 block">
                account_balance
              </span>
              <p className="font-medium text-text-secondary text-sm">Ledger is empty</p>
              <p className="mt-1">
                Your initial deposit of ₹1,00,000.00 will appear here upon registration.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
