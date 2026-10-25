import React, { useState, useEffect } from 'react';
import { JournalEntry, Asset } from '../types';
import { api } from '../api/client';
import { BookOpen, Plus, Trash2, Edit3, X, Info, Sparkles } from 'lucide-react';

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
      console.error('Failed to delete note', err);
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
        setEntries(entries.map((item) => (item.id === updated.id ? updated : item)));
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
      console.error('Failed to save journal note', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Journal & Review</h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture your thesis, risk management plan, exit reasoning, and lessons learned.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Educational Disclaimer banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Journal stops and target prices are for post-trade review and self-discipline. They do not trigger real or automatic simulated orders.
        </span>
      </div>

      {/* Journal Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading journal entries...</div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base">
                    {entry.asset_symbol || 'General Market Note'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(entry)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thesis */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Trade Thesis & Logic
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{entry.thesis}</p>
              </div>

              {/* Risk Plan: Planned Entry, Stop, Target */}
              {(entry.planned_entry || entry.planned_stop || entry.planned_target) && (
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Planned Entry</span>
                    <span className="font-semibold text-slate-300">
                      {entry.planned_entry ? `₹${entry.planned_entry.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Planned Stop</span>
                    <span className="font-semibold text-rose-400">
                      {entry.planned_stop ? `₹${entry.planned_stop.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Target</span>
                    <span className="font-semibold text-emerald-400">
                      {entry.planned_target ? `₹${entry.planned_target.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Exit Reason & Lessons */}
              {entry.exit_reason && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5">
                    Exit Notes
                  </span>
                  <p className="text-xs text-slate-300">{entry.exit_reason}</p>
                </div>
              )}

              {entry.lesson_learned && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] font-bold text-blue-200">Lesson Learned:</strong>
                    <span>{entry.lesson_learned}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 text-xs">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p>Your trade journal is currently empty.</p>
          <p className="text-slate-600 mt-1">
            Write down your reasoning before each trade to track consistency and eliminate emotional errors.
          </p>
        </div>
      )}

      {/* Modal for Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingEntry ? 'Edit Journal Entry' : 'New Trade Journal Entry'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {!editingEntry && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Target Asset</label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.symbol} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Trade Thesis & Catalyst</label>
                <textarea
                  rows={3}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why are you taking this trade? What technical/fundamental signals support your bias?"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Planned Entry (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedEntry || ''}
                    onChange={(e) => setPlannedEntry(parseFloat(e.target.value) || undefined)}
                    placeholder="e.g. 2950"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Planned Stop (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedStop || ''}
                    onChange={(e) => setPlannedStop(parseFloat(e.target.value) || undefined)}
                    placeholder="e.g. 2900"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Planned Target (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={plannedTarget || ''}
                    onChange={(e) => setPlannedTarget(parseFloat(e.target.value) || undefined)}
                    placeholder="e.g. 3100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Exit Notes / Outcome (Optional)</label>
                <input
                  type="text"
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  placeholder="e.g. Exited early at resistance, or hit stop loss"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Lessons Learned (Optional)</label>
                <textarea
                  rows={2}
                  value={lessonLearned}
                  onChange={(e) => setLessonLearned(e.target.value)}
                  placeholder="What would you do differently next time?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20"
              >
                {editingEntry ? 'Update Journal Note' : 'Save Journal Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

