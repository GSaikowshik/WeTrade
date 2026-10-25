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
    <div className="flex flex-col w-full pb-14 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#00E676] font-semibold">
              Psychology &amp; Discipline
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Trade Reflections
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Trade Journal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Eliminate emotional bias: document setups, risk-reward ratios, stop targets, and post-trade learnings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-black font-bold text-xs transition-all flex items-center gap-2 shadow-glow-green active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          <span>New Journal Note</span>
        </button>
      </div>

      {/* Main Entries Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#00E676]/30 border-t-[#00E676] animate-spin mb-3"></div>
          <span>Loading journal reflections...</span>
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                        {entry.asset_symbol?.slice(0, 2) || 'EQ'}
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm tracking-tight">
                          {entry.asset_symbol || 'NSE Instrument'}
                        </span>
                        <div className="text-[10px] font-mono text-slate-500">
                          {new Date(entry.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rrRatio && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#00E676]/10 border border-[#00E676]/25 text-[#00E676] text-[10px] font-mono font-bold">
                          R:R {rrRatio}:1
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF385C] hover:bg-[#FF385C]/10 transition-colors"
                        title="Delete Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Thesis Body */}
                  <div className="mt-3 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Thesis &amp; Setup Context
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
                      {entry.thesis}
                    </p>
                  </div>

                  {/* Strategy Targets Strip */}
                  {(entry.planned_entry || entry.planned_stop || entry.planned_target) && (
                    <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#070A11]/60 border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Entry</span>
                        <span className="font-semibold text-white">
                          {entry.planned_entry ? `₹${fmtMoney(entry.planned_entry)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Stop Loss</span>
                        <span className="font-semibold text-[#FF385C]">
                          {entry.planned_stop ? `₹${fmtMoney(entry.planned_stop)}` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Target</span>
                        <span className="font-semibold text-[#00E676]">
                          {entry.planned_target ? `₹${fmtMoney(entry.planned_target)}` : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Post-Trade Review Notes */}
                  {(entry.exit_reason || entry.lesson_learned) && (
                    <div className="mt-4 pt-3 border-t border-white/5 text-xs space-y-2">
                      {entry.exit_reason && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Exit Trigger:</span>
                          <span className="text-slate-300 font-medium">{entry.exit_reason}</span>
                        </div>
                      )}
                      {entry.lesson_learned && (
                        <div className="p-3 rounded-xl bg-[#00E676]/5 border border-[#00E676]/15">
                          <span className="text-[10px] font-mono uppercase font-bold text-[#00E676] block mb-0.5">
                            Key Lesson Learned
                          </span>
                          <span className="text-slate-200 italic">
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
        <div className="glass-card rounded-2xl p-16 text-center text-xs">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <span className="material-symbols-outlined text-[32px]">menu_book</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Your trade journal is empty
          </h3>
          <p className="text-slate-400 mt-1 max-w-sm mx-auto text-xs">
            Disciplined traders maintain a written journal to formulate setups, avoid revenge trading, and review executions.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-black font-bold text-xs transition-all inline-flex items-center gap-2 shadow-glow-green active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Write First Trade Entry</span>
          </button>
        </div>
      )}

      {/* Create / Edit Journal Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-[#0C111E]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col text-white">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingEntry ? 'Edit Trade Journal Note' : 'New Trade Journal Entry'}
                </h3>
                <span className="text-xs text-slate-400">
                  Formulate setup rationale, price targets, and disciplined execution
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs overflow-y-auto max-h-[80vh]">
              {!editingEntry && (
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                    Select Instrument
                  </label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] text-sm"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#111726] text-white">
                        {a.symbol} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                  Trade Thesis &amp; Rationale *
                </label>
                <textarea
                  rows={3}
                  required
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why are you taking this trade? (e.g. 50 EMA bounce, resistance breakout with above-average volume)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] resize-none text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Entry (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedEntry ?? ''}
                    onChange={(e) =>
                      setPlannedEntry(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="2940.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Stop (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedStop ?? ''}
                    onChange={(e) =>
                      setPlannedStop(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="2900.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Target (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedTarget ?? ''}
                    onChange={(e) =>
                      setPlannedTarget(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="3020.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                  Exit Rationale (Optional)
                </label>
                <input
                  type="text"
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  placeholder="Target hit, trailing stop breached, thesis invalidated..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                  Post-Trade Reflection
                </label>
                <textarea
                  rows={2}
                  value={lessonLearned}
                  onChange={(e) => setLessonLearned(e.target.value)}
                  placeholder="What worked well? Did you follow your initial plan?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] resize-none text-xs leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-black font-bold shadow-glow-green transition-all active:scale-95"
                >
                  {editingEntry ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
