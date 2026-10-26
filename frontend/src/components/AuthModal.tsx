import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsRegister(initialMode === 'register');
    setError(null);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await api.register(trimmedEmail, password, fullName.trim() || undefined);
      } else {
        await api.login(trimmedEmail, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err?.message || 'Authentication failed. Please verify credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-xs">
              W
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {isRegister ? 'Open Virtual Account' : 'Sign In to We Trade'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isRegister
                  ? 'Receive ₹1,00,000.00 virtual capital instantly'
                  : 'Access your simulated positions, ledger & journal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Segmented Mode Selector */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                !isRegister
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                isRegister
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Open Demo</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {isRegister && (
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm placeholder:text-slate-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm placeholder:text-slate-400 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Password *
              </label>
              <span className="text-[10px] text-slate-400">Min. 6 characters</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm placeholder:text-slate-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {loading ? 'sync' : isRegister ? 'check_circle' : 'login'}
            </span>
            <span>
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Create Account & Credit ₹1,00,000'
                : 'Sign In to Workspace'}
            </span>
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "New here? Open a virtual demo account with ₹1,00,000"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
