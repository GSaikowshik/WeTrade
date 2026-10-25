import React, { useState } from 'react';
import { api } from '../api/client';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await api.register(email, password, fullName || undefined);
      } else {
        await api.login(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] bg-[#0C111E]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col text-white">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E676] to-[#00F0FF] p-[1.5px] shadow-glow-green">
              <div className="w-full h-full bg-[#070A11] rounded-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-[#00E676]">
                  candlestick_chart
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isRegister ? 'Open Virtual Account' : 'Sign In to We Trade'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRegister
                  ? 'Receive ₹1,00,000.00 virtual capital instantly'
                  : 'Access your simulated positions, ledger & journal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {isRegister && (
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111726] text-white border border-white/10 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FF385C]/10 border border-[#FF385C]/30 text-[#FF385C] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-black font-bold text-xs transition-all shadow-glow-green active:scale-98 disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRegister ? 'check_circle' : 'login'}
            </span>
            <span>
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Create Account & Credit ₹1,00,000'
                : 'Sign In to Workspace'}
            </span>
          </button>

          <div className="text-center pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-[#00E676] transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account? Open a demo account with ₹1,00,000"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
