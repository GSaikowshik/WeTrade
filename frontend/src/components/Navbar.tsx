import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, PortfolioSummary } from '../types';
import { fmtMoney, toNum } from '../utils/format';

interface NavbarProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onLogout: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onResetSimulation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  portfolio,
  onLogout,
  onOpenAuth,
  onResetSimulation,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Markets', path: '/markets', icon: 'candlestick_chart' },
    { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' },
    { label: 'Orders', path: '/orders', icon: 'receipt_long' },
    { label: 'Trade Journal', path: '/journal', icon: 'menu_book' },
    { label: 'Academy', path: '/learn', icon: 'school' },
  ];

  const currentNav = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || { label: 'Trading Desk', path: '/dashboard' };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/markets?search=${encodeURIComponent(searchTerm.trim().toUpperCase())}`);
      setSearchTerm('');
    }
  };

  const totalValue = portfolio ? toNum(portfolio.total_portfolio_value) : 100000;

  return (
    <>
      {/* Luminous Light Sidebar synced with Landing Page */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header matching Landing Page */}
          <div className="h-[76px] px-5 flex items-center justify-between border-b border-slate-100">
            <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileMenuOpen(false)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
                W
              </span>
              <span>
                <span className="block text-xl font-extrabold tracking-tight text-slate-900">
                  WeTrade
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  Learn by doing
                </span>
              </span>
            </Link>
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-5 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-xs ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Virtual Account Box */}
        <div className="p-4 flex flex-col gap-3">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Practice Portfolio
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-700 font-extrabold tracking-wider uppercase font-mono">
                  Live Sim
                </span>
              </div>
            </div>

            <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              ₹{fmtMoney(totalValue)}
            </div>

            <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  if (onResetSimulation) onResetSimulation();
                  else if (!user) onOpenAuth('register');
                }}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Reset Balance</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Luminous Light Top Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 h-[76px] bg-white/90 backdrop-blur-xl border-b border-slate-200 z-40 px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">WeTrade</span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-900">
              {currentNav.label}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] uppercase font-bold tracking-wider font-mono">
              VIRTUAL ₹1,00,000
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] uppercase font-bold tracking-wider font-mono">
              NSE SIMULATED
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs md:max-w-md mx-2">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[17px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Indian stocks (RELIANCE, TCS)..."
              className="w-full pl-10 pr-12 py-2.5 rounded-full bg-slate-50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-slate-200 focus:border-emerald-500 transition-all shadow-2xs"
            />
            <span className="absolute right-3 px-1.5 py-0.5 bg-white border border-slate-200 text-slate-400 rounded text-[10px] font-mono font-medium">
              ⌘K
            </span>
          </div>
        </form>

        {/* Right: Market Status & User Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              NSE: 09:15 - 15:30 IST
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Practice Account
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-emerald-400"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Open Demo</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
