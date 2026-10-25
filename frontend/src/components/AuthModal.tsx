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
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
              W
            </div>
            <div>
              <h2 className="font-semibold text-text-primary text-base">
                {isRegister ? 'Open Virtual Account' : 'Welcome to We Trade'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isRegister ? 'Receive ₹1,00,000 in simulated practice capital' : 'Sign in to access your portfolio & journal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-subtle transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body-md text-body-md">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-primary">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditya Sharma"
                  className="w-full bg-surface-subtle border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full bg-surface-subtle border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-[18px]">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-subtle border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-market-down-subtle border border-market-down/20 rounded-lg flex items-center gap-2 text-xs text-market-down">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-medium text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Validating...'
                : isRegister
                ? 'Create Simulator Account'
                : 'Sign In to Simulator'}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : 'Need an account? Open free virtual demo account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AuthModal;
