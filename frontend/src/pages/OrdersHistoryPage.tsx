import React, { useState, useEffect } from 'react';
import { Order, LedgerEntry } from '../types';
import { api } from '../api/client';
import { toNum, fmtMoney } from '../utils/format';

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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
              Ledger
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
              Audit Trail
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary">Orders & Transaction Ledger</h1>
          <p className="font-body-sm text-body-sm text-text-secondary mt-1">
            Complete audit trail of simulated order states and append-only cash movements.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-surface-card border border-border-subtle rounded-xl p-1 w-fit shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Simulated Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            <span>Cash Ledger ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* Orders Tab View */}
      {activeTab === 'orders' && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-text-secondary text-xs">Loading order ledger...</div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-subtle text-text-secondary font-label-sm text-label-sm uppercase tracking-wider h-9">
                    <th className="py-2 px-3 rounded-l-md">Time</th>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Side</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Filled Price</th>
                    <th className="py-2 px-3 text-right">Total Amount</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right rounded-r-md">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {orders.map((ord) => {
                    const isBuy = ord.side === 'BUY';
                    const fillPrice = toNum(ord.average_fill_price || ord.limit_price);
                    const notional = fillPrice * ord.quantity;

                    return (
                      <tr key={ord.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-text-primary font-numeric-sm">
                          {ord.asset_symbol || ord.asset_id}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            isBuy ? 'bg-market-up-subtle text-market-up' : 'bg-market-down-subtle text-market-down'
                          }`}>
                            {ord.side}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-text-secondary text-xs uppercase font-mono">
                          {ord.order_type}
                        </td>
                        <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary">
                          {ord.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary">
                          {fmtMoney(fillPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary font-medium">
                          {fmtMoney(notional)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase font-mono ${
                            ord.status === 'FILLED'
                              ? 'bg-market-up-subtle text-market-up'
                              : ord.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-market-down-subtle text-market-down'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {ord.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord.id)}
                              disabled={cancellingId === ord.id}
                              className="px-2.5 py-1 text-xs rounded bg-surface-container hover:bg-market-down hover:text-white text-text-secondary transition cursor-pointer"
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
            <div className="py-12 text-center text-text-secondary">
              <span className="material-symbols-outlined text-[32px] text-text-tertiary mb-2 block">
                receipt_long
              </span>
              <p className="font-semibold text-text-primary">No simulated orders yet</p>
              <p className="text-xs text-text-secondary mt-1">
                Your executed market & limit orders will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ledger Tab View */}
      {activeTab === 'ledger' && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-text-secondary text-xs">Loading cash ledger...</div>
          ) : ledger.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-subtle text-text-secondary font-label-sm text-label-sm uppercase tracking-wider h-9">
                    <th className="py-2 px-3 rounded-l-md">Timestamp</th>
                    <th className="py-2 px-3">Transaction Description</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right rounded-r-md">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {ledger.map((entry) => {
                    const amt = toNum(entry.amount);
                    const isCredit = amt >= 0;

                    return (
                      <tr key={entry.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-3 px-3 text-text-secondary text-xs font-mono">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-text-primary font-medium">
                          {entry.metadata_json || `${entry.entry_type} (Order #${entry.order_id || 'system'})`}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-surface-container text-on-surface">
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-numeric-sm font-semibold [font-feature-settings:'tnum'] ${
                          isCredit ? 'text-market-up' : 'text-market-down'
                        }`}>
                          {isCredit ? '+' : ''}{fmtMoney(amt)}
                        </td>
                        <td className="py-3 px-3 text-right font-numeric-sm [font-feature-settings:'tnum'] text-text-primary font-medium">
                          {fmtMoney(toNum(entry.resulting_balance))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-text-secondary">
              <span className="material-symbols-outlined text-[32px] text-text-tertiary mb-2 block">
                account_balance_wallet
              </span>
              <p className="font-semibold text-text-primary">No ledger entries recorded</p>
              <p className="text-xs text-text-secondary mt-1">
                Cash transactions and fee debits will be journaled in an append-only sequence.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default OrdersHistoryPage;
