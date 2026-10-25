import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, PortfolioSummary } from '../types';
import { fmtMoney, toNum } from '../utils/format';

interface NavbarProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onLogout: () => void;
  onOpenAuth: () => void;
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
    { label: 'Overview', path: '/', icon: 'dashboard' },
    { label: 'Markets', path: '/markets', icon: 'candlestick_chart' },
    { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' },
    { label: 'Orders', path: '/orders', icon: 'receipt_long' },
    { label: 'Trade Journal', path: '/journal', icon: 'menu_book' },
    { label: 'Learn', path: '/learn', icon: 'school' },
  ];

  const currentNav = navItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || { label: 'Terminal', path: '/' };

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
      {/* Sleek Dark Neo-Fintech Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0A0E1A]/95 backdrop-blur-2xl border-r border-white/5 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/5">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
                W
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">
                  We Trade
                </span>
                <span className="text-[10px] font-bold text-emerald-400/90 tracking-wider uppercase font-mono">
                  Neo Simulator
                </span>
              </div>
            </Link>
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 flex flex-col gap-1.5">
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
                      ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-400 border-l-2 border-emerald-400 font-semibold shadow-[inset_0_0_12px_rgba(16,185,129,0.06)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
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
          <div className="bg-gradient-to-b from-[#141B2D] to-[#0E1322] rounded-2xl p-4 border border-white/10 shadow-xl shadow-black/40 relative overflow-hidden group">
            {/* Ambient neon backdrop glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>

            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Virtual Balance
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase font-mono">
                  Live Sim
                </span>
              </div>
            </div>

            <div className="text-xl font-extrabold text-white tracking-tight font-mono relative z-10">
              ₹{fmtMoney(totalValue)}
            </div>

            <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-white/5 relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (onResetSimulation) onResetSimulation();
                  else if (!user) onOpenAuth();
                }}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Reset Capital</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sleek Dark Neo-Fintech Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-[#070A11]/85 backdrop-blur-2xl border-b border-white/5 z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-white/5"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">We Trade</span>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-xs font-semibold text-white">
              {currentNav.label}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 pl-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-wider font-mono">
              VIRTUAL 100K
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider font-mono">
              NSE SIMULATED
            </span>
          </div>
        </div>

        {/* Center: Search Bar with ⌘K shortcut */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs md:max-w-md mx-2">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-500 text-[17px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Indian stocks (RELIANCE, TCS)..."
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-[#111726]/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 border border-white/5 focus:border-emerald-500/40 transition-all shadow-inner"
            />
            <span className="absolute right-2.5 px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded-md text-[10px] font-mono font-medium">
              ⌘K
            </span>
          </div>
        </form>

        {/* Right: Market Status & User Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              NSE: 09:15 - 15:30 IST
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Demo Trader
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
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
