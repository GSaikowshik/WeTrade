import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { Analytics } from '@vercel/analytics/react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';

import LandingPage from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { PortfolioPage } from './pages/PortfolioPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { TradeJournalPage } from './pages/TradeJournalPage';
import { LearnPage } from './pages/LearnPage';

import { User, PortfolioSummary, Asset } from './types';
import { api } from './api/client';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const assetList = await api.getAssets();
        setAssets(assetList);

        if (api.getToken()) {
          try {
            const me = await api.getMe();
            setUser(me);

            const p = await api.getPortfolio();
            setPortfolio(p);
          } catch {
            api.logout();
            setUser(null);
            setPortfolio(null);
          }
        }
      } catch (err) {
        console.error('Failed to bootstrap app', err);
      }
    };

    bootstrap();
  }, []);

  const refreshPortfolio = async () => {
    if (api.getToken()) {
      try {
        const p = await api.getPortfolio();
        setPortfolio(p);
      } catch (err) {
        console.error('Failed to refresh portfolio', err);
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPortfolio(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Dashboard navigation only */}
      {!isLandingPage && (
        <Navbar
          user={user}
          portfolio={portfolio}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      <div
        className={
          isLandingPage
            ? 'flex-1'
            : 'md:pl-64 pt-[76px] flex-1 flex flex-col justify-between'
        }
      >
        <main
          className={
            isLandingPage
              ? ''
              : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
          }
        >
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Existing trading dashboard */}
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  user={user}
                  portfolio={portfolio}
                  onRefreshPortfolio={refreshPortfolio}
                  onOpenAuth={() => setShowAuthModal(true)}
                />
              }
            />

            {/* Existing trading features */}
            <Route
              path="/markets"
              element={
                <Markets
                  portfolio={portfolio}
                  onRefreshPortfolio={refreshPortfolio}
                />
              }
            />

            <Route
              path="/portfolio"
              element={
                <PortfolioPage
                  portfolio={portfolio}
                  assets={assets}
                  onRefreshPortfolio={refreshPortfolio}
                />
              }
            />

            <Route
              path="/orders"
              element={<OrdersHistoryPage />}
            />

            <Route
              path="/journal"
              element={<TradeJournalPage assets={assets} />}
            />

            <Route
              path="/learn"
              element={<LearnPage />}
            />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </main>

        {/* Existing dashboard footer only */}
        {!isLandingPage && (
          <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-500 bg-white mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-1">
              <p className="font-semibold text-slate-700">
                WeTrade &copy; {new Date().getFullYear()} — Virtual Trading &amp; Financial Learning Platform.
              </p>
              <p className="text-[11px] text-slate-400">
                Simulated virtual capital only. Trading activity and balances are educational and do not represent actual investments. No monetary deposit or investment risk.
              </p>
            </div>
          </footer>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      <Analytics />
    </div>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);