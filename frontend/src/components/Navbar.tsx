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
    { label: 'Watchlist', path: '/markets', icon: 'bookmark' },
    { label: 'Portfolio', path: '/portfolio', icon: 'pie_chart' },
    { label: 'Orders', path: '/orders', icon: 'receipt_long' },
    { label: 'Trade Journal', path: '/journal', icon: 'menu_book' },
    { label: 'Learn', path: '/learn', icon: 'school' },
  ];

  const currentRouteName = () => {
    switch (location.pathname) {
      case '/':
        return 'Execution';
      case '/markets':
        return 'Markets & Quotes';
      case '/portfolio':
        return 'Holdings & Allocation';
      case '/orders':
        return 'Order Ledger';
      case '/journal':
        return 'Trade Journal';
      case '/learn':
        return 'We Trade Academy';
      default:
        return 'Desk';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/markets?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const availableCash = toNum(portfolio?.available_cash) || 100000;

  return (
    <>
      {/* Fixed Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-60 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col">
          {/* Logo */}
          <div className="h-14 px-space-md flex items-center justify-between">
            <Link to="/" className="flex items-center gap-space-sm" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline-sm font-semibold">
                W
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    We Trade
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider">
                  NSE Simulator
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded-md text-text-secondary hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="px-space-md py-space-xs">
            <div className="h-[1px] bg-surface-container-high w-full" />
          </div>

          {/* Navigation Links */}
          <nav className="px-space-xs py-space-xs flex flex-col gap-space-xs">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-medium'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Box */}
        <div className="p-space-md flex flex-col gap-space-sm">
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-secondary">
                Virtual Portfolio
              </span>
              <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-market-up-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-market-up animate-pulse" />
                <span className="font-label-sm text-label-sm text-market-up font-semibold">
                  DEMO LIVE
                </span>
              </div>
            </div>
            <div className="font-numeric-md text-numeric-md text-on-surface font-semibold tracking-tight">
              {fmtMoney(availableCash)}
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (onResetSimulation) {
                    onResetSimulation();
                  } else {
                    window.location.reload();
                  }
                }}
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Reset Simulation</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 md:left-60 right-0 h-14 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-lg flex items-center justify-between gap-space-md">
        {/* Left Breadcrumb & Badges */}
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md text-text-secondary">Virtual Desk</span>
            <span className="text-outline-variant font-label-sm text-label-sm">/</span>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {currentRouteName()}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-space-xs">
            <span className="px-2 py-0.5 rounded bg-badge-demo-bg text-badge-demo-text font-label-sm text-label-sm uppercase font-semibold">
              VIRTUAL ACCOUNT
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase font-semibold">
              DEMO DATA (NSE)
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-space-md">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stocks (e.g. RELIANCE, TCS, INFY, HDFCBANK)..."
              className="w-full pl-9 pr-14 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
            />
            <span className="absolute right-2 px-1.5 py-0.5 bg-surface-subtle text-text-secondary rounded text-[11px] font-mono font-medium shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              ⌘K
            </span>
          </form>
        </div>

        {/* Right Status & Account */}
        <div className="flex items-center gap-space-md">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-market-up-subtle text-market-up">
            <span className="w-2 h-2 rounded-full bg-market-up" />
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
              NSE Open: 09:15 - 15:30 IST
            </span>
          </div>

          <button
            type="button"
            className="relative p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-error" />
          </button>

          {user ? (
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs">
                {user.full_name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-medium leading-tight">
                  {user.full_name || user.email.split('@')[0]}
                </span>
                <span className="font-label-sm text-label-sm text-text-secondary leading-none">
                  Sim Trader
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-text-secondary hover:text-error hover:bg-surface-container rounded-lg transition-colors ml-1"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
