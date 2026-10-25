import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  PieChart,
  History,
  BookOpen,
  GraduationCap,
  LogOut,
  Wallet
} from 'lucide-react';
import { User, PortfolioSummary } from '../types';

interface NavbarProps {
  user: User | null;
  portfolio: PortfolioSummary | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  portfolio,
  onLogout,
  onOpenAuth,
}) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Markets', path: '/markets', icon: TrendingUp },
    { label: 'Portfolio', path: '/portfolio', icon: PieChart },
    { label: 'Orders & History', path: '/orders', icon: History },
    { label: 'Trade Journal', path: '/journal', icon: BookOpen },
    { label: 'Learn', path: '/learn', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800">
      {/* Top Disclaimer Notice */}
      <div className="bg-blue-950/40 border-b border-blue-900/40 px-4 py-1 text-center text-[11px] text-blue-300 flex items-center justify-center gap-1.5 font-medium">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        <span>Virtual Trading Simulator — No real money or brokerage risk. All Indian equity prices are simulated/demo.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight leading-none">We Trade</span>
                <span className="text-[10px] text-slate-400 font-medium">Virtual Markets</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions: Cash & Account */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Virtual Cash Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-400 leading-tight">Virtual Cash</span>
                    <span className="font-bold text-emerald-400 leading-tight">
                      ₹{portfolio ? portfolio.available_cash.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '100,000.00'}
                    </span>
                  </div>
                </div>

                {/* User menu / Logout */}
                <div className="flex items-center gap-2">
                  <div className="text-right hidden lg:block">
                    <div className="text-xs font-semibold text-white leading-tight">
                      {user.full_name || user.email.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">{user.email}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Log out"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-500/20"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

