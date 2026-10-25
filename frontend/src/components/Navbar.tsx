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
  ) || { label: 'Trading Desk', path: '/' };

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
      {/* Fixed Left Sidebar - Stitch Template */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-14 px-space-md flex items-center justify-between gap-space-sm border-b border-surface-container-high/40">
            <Link to="/" className="flex items-center gap-space-sm" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline-sm font-semibold shadow-sm">
                W
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    We Trade
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-text-secondary uppercase tracking-wider text-[10px]">
                  NSE Simulator
                </span>
              </div>
            </Link>
            <button
              className="md:hidden p-1 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-space-xs py-space-sm flex flex-col gap-1">
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
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors font-body-md text-body-md ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-medium shadow-sm'
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

        {/* Bottom Virtual Account Box */}
        <div className="p-space-md flex flex-col gap-space-sm">
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-secondary text-[10px]">
                Virtual Portfolio
              </span>
              <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-market-up-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-market-up animate-pulse"></span>
                <span className="font-label-sm text-[10px] text-market-up font-semibold uppercase">
                  DEMO LIVE
                </span>
              </div>
            </div>
            <div className="font-numeric-md text-numeric-md text-on-surface font-semibold tracking-tight">
              ₹{fmtMoney(totalValue)}
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between border-t border-surface-container-high/50 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (onResetSimulation) onResetSimulation();
                  else if (!user) onOpenAuth();
                }}
                className="font-label-md text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                <span>Reset Simulation</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-on-surface/30 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Top Header - Stitch Template */}
      <header className="fixed top-0 left-0 md:left-60 right-0 h-14 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/50 z-40 px-4 sm:px-space-lg flex items-center justify-between gap-space-md">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-surface-container"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <div className="hidden sm:flex items-center gap-space-xs">
            <span className="font-label-md text-label-md text-text-secondary">Virtual Desk</span>
            <span className="text-outline-variant font-label-sm text-label-sm">/</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {currentNav.label}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-space-xs pl-2">
            <span className="px-2 py-0.5 rounded bg-badge-demo-bg text-badge-demo-text font-label-sm text-[10px] uppercase font-semibold">
              VIRTUAL ACCOUNT
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] uppercase font-semibold">
              DEMO DATA (NSE)
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs md:max-w-md mx-2 sm:mx-space-md">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stocks (RELIANCE, TCS, INFY)..."
              className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-surface-container-high/60"
            />
            <span className="absolute right-2 px-1.5 py-0.5 bg-surface-subtle text-text-secondary rounded text-[10px] font-mono font-medium border border-border-subtle shadow-xs">
              ⌘K
            </span>
          </div>
        </form>

        {/* Right: Market Status & User Controls */}
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-market-up-subtle text-market-up">
            <span className="w-2 h-2 rounded-full bg-market-up"></span>
            <span className="font-label-sm text-[11px] font-semibold uppercase tracking-wider">
              NSE Open: 09:15 - 15:30 IST
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-semibold flex items-center justify-center text-xs shadow-sm">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-medium leading-tight">
                  {user.email.split('@')[0]}
                </span>
                <span className="font-label-sm text-[10px] text-text-secondary leading-none">
                  Sim Trader
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-text-secondary hover:text-error hover:bg-market-down-subtle transition-colors ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
