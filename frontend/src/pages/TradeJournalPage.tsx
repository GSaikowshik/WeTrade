import React, { useState, useEffect } from 'react';
import { JournalEntry, Asset } from '../types';
import { api } from '../api/client';
import { fmtMoney } from '../utils/format';

interface TradeJournalPageProps {
  assets: Asset[];
}

export const TradeJournalPage: React.FC<TradeJournalPageProps> = ({ assets }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form state
  const [assetId, setAssetId] = useState<number>(assets[0]?.id || 1);
  const [thesis, setThesis] = useState('');
  const [plannedEntry, setPlannedEntry] = useState<number | undefined>(undefined);
  const [plannedStop, setPlannedStop] = useState<number | undefined>(undefined);
  const [plannedTarget, setPlannedTarget] = useState<number | undefined>(undefined);
  const [exitReason, setExitReason] = useState('');
  const [lessonLearned, setLessonLearned] = useState('');

  useEffect(() => {
    loadJournal();
  }, []);

  const loadJournal = async () => {
    setLoading(true);
    try {
      const res = await api.getJournal();
      setEntries(res);
    } catch (err) {
      console.error('Failed to load journal', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setAssetId(assets[0]?.id || 1);
    setThesis('');
    setPlannedEntry(undefined);
    setPlannedStop(undefined);
    setPlannedTarget(undefined);
    setExitReason('');
    setLessonLearned('');
    setShowModal(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setAssetId(entry.asset_id || assets[0]?.id || 1);
    setThesis(entry.thesis);
    setPlannedEntry(entry.planned_entry);
    setPlannedStop(entry.planned_stop);
    setPlannedTarget(entry.planned_target);
    setExitReason(entry.exit_reason || '');
    setLessonLearned(entry.lesson_learned || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this journal note?')) return;
    try {
      await api.deleteJournal(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete journal entry', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        const updated = await api.updateJournal(editingEntry.id, {
          thesis,
          planned_entry: plannedEntry,
          planned_stop: plannedStop,
          planned_target: plannedTarget,
          exit_reason: exitReason || undefined,
          lesson_learned: lessonLearned || undefined,
        });
        setEntries(entries.map((entry) => (entry.id === updated.id ? updated : entry)));
      } else {
        const created = await api.createJournal({
          asset_id: assetId,
          thesis,
          planned_entry: plannedEntry,
          planned_stop: plannedStop,
          planned_target: plannedTarget,
          exit_reason: exitReason || undefined,
          lesson_learned: lessonLearned || undefined,
        });
        setEntries([created, ...entries]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save journal entry', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 space-y-space-lg animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-[11px] text-primary uppercase font-semibold tracking-wider">
              Trader Psychology
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-[11px] text-text-secondary uppercase tracking-wider">
              Reflection Log
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold text-text-primary tracking-tight">
            Trade Journal
          </h1>
          <p className="font-body-sm text-body-sm text-text-secondary text-xs mt-1">
            Eliminate emotional bias: document your entry rationale, risk-to-reward ratio, stop targets, and post-trade learnings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Main Entries Grid */}
      {loading ? (
        <div className="py-16 text-center text-text-tertiary text-xs">
          Loading journal reflections...
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {entries.map((entry) => {
            const risk =
              entry.planned_entry && entry.planned_stop
                ? Math.abs(entry.planned_entry - entry.planned_stop)
                : null;
            const reward =
              entry.planned_entry && entry.planned_target
                ? Math.abs(entry.planned_target - entry.planned_entry)
                : null;
            const rrRatio = risk && reward ? (reward / risk).toFixed(1) : null;

            return (
              <div
                key={entry.id}
                className="p-space-md rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center font-bold text-[11px] text-text-primary shadow-2xs">
                        {entry.asset_symbol?.slice(0, 2) || 'EQ'}
                      </div>
                      <div>
                        <span className="font-bold text-text-primary text-sm">
                          {entry.asset_symbol || 'NSE Instrument'}
                        </span>
                        <div className="text-[10px] text-text-tertiary">
                          {new Date(entry.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {rrRatio && (
                        <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary text-[10px] font-bold">
                          R:R {rrRatio}:1
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(entry)}
                        className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-container-low"
                        title="Edit Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 rounded text-text-tertiary hover:text-market-down hover:bg-market-down-subtle"
                        title="Delete Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Thesis Body */}
                  <div className="mt-2 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-text-tertiary block mb-0.5">
                      Trade Thesis &amp; Rationale
                    </span>
                    <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                      {entry.thesis}
                    </p>
                  </div>

                  {/* Strategy Targets Strip */}
                  {(entry.planned_entry || entry.planned_stop || entry.planned_target) && (
                    <div className="mt-3 grid grid-cols-3 gap-2 p-2 rounded-lg bg-surface-container-low text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-text-tertiary block">
                          Planned Entry
                        </span>
                        <span className="font-semibold text-text-primary">
                          {entry.planned_entry ? `₹${fmtMoney(entry.planned_entry)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-text-tertiary block">
                          Stop Target
                        </span>
                        <span className="font-semibold text-market-down">
                          {entry.planned_stop ? `₹${fmtMoney(entry.planned_stop)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-text-tertiary block">
                          Profit Target
                        </span>
                        <span className="font-semibold text-market-up">
                          {entry.planned_target ? `₹${fmtMoney(entry.planned_target)}` : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Post-Trade Review Notes */}
                  {(entry.exit_reason || entry.lesson_learned) && (
                    <div className="mt-3 pt-2 border-t border-surface-container-low text-xs space-y-1.5">
                      {entry.exit_reason && (
                        <div>
                          <span className="text-[10px] font-semibold text-text-tertiary block">
                            Exit Trigger:
                          </span>
                          <span className="text-text-secondary">{entry.exit_reason}</span>
                        </div>
                      )}
                      {entry.lesson_learned && (
                        <div className="p-2 rounded bg-surface-subtle border border-border-subtle">
                          <span className="text-[10px] font-semibold text-primary block">
                            Key Lesson Learned:
                          </span>
                          <span className="text-text-primary italic">
                            "{entry.lesson_learned}"
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-surface-card shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60 text-center text-xs">
          <span className="material-symbols-outlined text-[36px] text-text-tertiary mx-auto mb-2 block">
            menu_book
          </span>
          <h3 className="font-headline-sm text-base text-text-primary font-semibold">
            Your trade journal is empty
          </h3>
          <p className="text-text-secondary mt-1 max-w-sm mx-auto">
            Top traders maintain a written journal to track setups, avoid revenge trading, and objectively review wins &amp; losses.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Write First Trade Entry</span>
          </button>
        </div>
      )}

      {/* Create / Edit Journal Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col text-on-surface">
            <div className="bg-surface-base px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-base text-text-primary font-semibold">
                  {editingEntry ? 'Edit Trade Journal Note' : 'New Trade Journal Entry'}
                </h3>
                <span className="text-xs text-text-secondary">
                  Capture setup logic, targets, and emotional discipline
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3 text-xs overflow-y-auto max-h-[80vh]">
              {!editingEntry && (
                <div>
                  <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                    Select Instrument
                  </label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.symbol} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                  Trade Thesis &amp; Rationale *
                </label>
                <textarea
                  rows={3}
                  required
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why are you taking this trade? (e.g. breakout above resistance, consolidation pullback)..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                    Planned Entry (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedEntry ?? ''}
                    onChange={(e) =>
                      setPlannedEntry(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="2940.00"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                    Planned Stop (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedStop ?? ''}
                    onChange={(e) =>
                      setPlannedStop(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="2900.00"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                    Profit Target (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedTarget ?? ''}
                    onChange={(e) =>
                      setPlannedTarget(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="3020.00"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                  Exit Rationale (Optional)
                </label>
                <input
                  type="text"
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  placeholder="Target hit, stopped out, trailing stop triggered..."
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                  Lesson Learned / Reflection
                </label>
                <textarea
                  rows={2}
                  value={lessonLearned}
                  onChange={(e) => setLessonLearned(e.target.value)}
                  placeholder="What did you do right? What could you improve next time?"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="pt-3 border-t border-surface-container-low flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold shadow-sm"
                >
                  {editingEntry ? 'Update Entry' : 'Save Journal Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
