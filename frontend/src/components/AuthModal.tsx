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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col text-on-surface">
        {/* Modal Top Header */}
        <div className="bg-surface-base px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline-sm font-semibold shadow-2xs">
              W
            </div>
            <div>
              <h2 className="font-headline-sm text-base text-text-primary font-semibold tracking-tight">
                {isRegister ? 'Open Virtual Account' : 'Sign in to We Trade'}
              </h2>
              <p className="font-body-sm text-[11px] text-text-secondary">
                {isRegister
                  ? 'Receive ₹1,00,000.00 virtual capital instantly'
                  : 'Access your simulated positions, ledger & journal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 text-xs">
          {isRegister && (
            <div>
              <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold text-[10px] block mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-text-primary border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-market-down-subtle border border-market-down/20 text-market-down text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 mt-1 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRegister ? 'check_circle' : 'login'}
            </span>
            <span>
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Create Virtual Account & Credit ₹1,00,000'
                : 'Sign In to Workspace'}
            </span>
          </button>

          <div className="text-center pt-2 border-t border-surface-container-low">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-text-secondary hover:text-primary transition-colors"
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
