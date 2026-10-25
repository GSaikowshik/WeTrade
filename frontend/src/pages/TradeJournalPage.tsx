import React, { useState, useEffect } from 'react';
import { JournalEntry, Asset } from '../types';
import { api } from '../api/client';
import { fmtMoney, toNum } from '../utils/format';

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
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.deleteJournal(id);
      await loadJournal();
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await api.updateJournal(editingEntry.id, {
          thesis,
          planned_entry: plannedEntry,
          planned_stop: plannedStop,
          planned_target: plannedTarget,
          exit_reason: exitReason || undefined,
          lesson_learned: lessonLearned || undefined,
        });
      } else {
        await api.createJournal({
          asset_id: assetId,
          thesis,
          planned_entry: plannedEntry,
          planned_stop: plannedStop,
          planned_target: plannedTarget,
          exit_reason: exitReason || undefined,
          lesson_learned: lessonLearned || undefined,
        });
      }
      setShowModal(false);
      await loadJournal();
    } catch (err) {
      console.error('Failed to save entry', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-label-sm text-primary uppercase font-semibold tracking-wider">
              Discipline
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
              Trade Journal
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary">Trade Journal & Review</h1>
          <p className="font-body-sm text-body-sm text-text-secondary mt-1">
            Build psychological and risk discipline by logging entry thesis, risk:reward stops, and trade reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-medium transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="py-12 text-center text-text-secondary text-xs">Loading journal entries...</div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((item) => {
            const asset = assets.find((a) => a.id === item.asset_id);
            const risk = (item.planned_entry && item.planned_stop)
              ? Math.abs(toNum(item.planned_entry) - toNum(item.planned_stop))
              : null;
            const reward = (item.planned_entry && item.planned_target)
              ? Math.abs(toNum(item.planned_target) - toNum(item.planned_entry))
              : null;
            const rrRatio = (risk && reward && risk > 0) ? (reward / risk).toFixed(1) : null;

            return (
              <div
                key={item.id}
                className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-numeric-sm text-numeric-sm font-semibold text-text-primary">
                          {asset?.symbol || `Asset #${item.asset_id}`}
                        </span>
                        {rrRatio && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
                            1:{rrRatio} R:R
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-surface-subtle transition"
                        title="Edit Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-text-secondary hover:text-market-down rounded hover:bg-surface-subtle transition"
                        title="Delete Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Thesis */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                      Trade Thesis
                    </span>
                    <p className="text-xs text-text-primary mt-1 whitespace-pre-wrap leading-relaxed">
                      {item.thesis}
                    </p>
                  </div>

                  {/* Price Targets */}
                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-lg bg-surface-subtle text-[11px]">
                    <div>
                      <span className="text-text-secondary block">Entry</span>
                      <span className="font-semibold text-text-primary font-numeric-sm [font-feature-settings:'tnum']">
                        {item.planned_entry ? fmtMoney(toNum(item.planned_entry)) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">Stop Loss</span>
                      <span className="font-semibold text-market-down font-numeric-sm [font-feature-settings:'tnum']">
                        {item.planned_stop ? fmtMoney(toNum(item.planned_stop)) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">Target</span>
                      <span className="font-semibold text-market-up font-numeric-sm [font-feature-settings:'tnum']">
                        {item.planned_target ? fmtMoney(toNum(item.planned_target)) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Review / Lesson Learned */}
                  {(item.exit_reason || item.lesson_learned) && (
                    <div className="mt-3 pt-2 border-t border-border-subtle text-xs space-y-1">
                      {item.exit_reason && (
                        <div>
                          <span className="text-text-secondary font-medium">Exit Reason: </span>
                          <span className="text-text-primary">{item.exit_reason}</span>
                        </div>
                      )}
                      {item.lesson_learned && (
                        <div>
                          <span className="text-primary font-medium">Lesson: </span>
                          <span className="text-text-primary">{item.lesson_learned}</span>
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
        <div className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-[36px] text-text-tertiary mb-2 block">
            menu_book
          </span>
          <h3 className="font-semibold text-text-primary">No journal entries yet</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Top traders write their thoughts before entering a trade. Document your thesis, risk:reward plan, and lessons learned.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition shadow-sm cursor-pointer"
          >
            Create First Journal Entry
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-semibold text-text-primary text-base">
                {editingEntry ? 'Edit Journal Entry' : 'Log Trade Thesis'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-subtle transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body-md text-body-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">Stock Instrument</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(Number(e.target.value))}
                  disabled={Boolean(editingEntry)}
                  className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">
                  Trade Thesis & Setup Reason *
                </label>
                <textarea
                  rows={3}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="e.g. Breakout above 50-day moving average with high volume. Support holding at ₹2,920."
                  required
                  className="w-full bg-surface-subtle border border-border-subtle rounded-lg p-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-primary">Planned Entry (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedEntry ?? ''}
                    onChange={(e) => setPlannedEntry(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="2940"
                    className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-primary">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedStop ?? ''}
                    onChange={(e) => setPlannedStop(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="2910"
                    className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-primary">Target (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedTarget ?? ''}
                    onChange={(e) => setPlannedTarget(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="3000"
                    className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">
                  Exit Reason / Execution Notes
                </label>
                <input
                  type="text"
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  placeholder="e.g. Hit target 1. Trailed stop loss to break even."
                  className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">
                  Key Lesson Learned (Post-Trade)
                </label>
                <input
                  type="text"
                  value={lessonLearned}
                  onChange={(e) => setLessonLearned(e.target.value)}
                  placeholder="e.g. Do not enter right before earnings announcement without hedging."
                  className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition shadow-sm cursor-pointer"
                >
                  {editingEntry ? 'Update Journal Entry' : 'Save Thesis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TradeJournalPage;
