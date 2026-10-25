import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { PortfolioPage } from './pages/PortfolioPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { TradeJournalPage } from './pages/TradeJournalPage';
import { LearnPage } from './pages/LearnPage';
import { User, PortfolioSummary, Asset } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const assetList = await api.getAssets();
      setAssets(assetList);

      const token = api.getToken();
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
          const p = await api.getPortfolio();
          setPortfolio(p);
        } catch {
          // invalid token
          api.logout();
          setUser(null);
          setPortfolio(null);
        }
      }
    } catch (err) {
      console.error('Failed to bootstrap app', err);
    }
  };

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
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0A0E17] text-slate-100 font-sans">
        <Navbar
          user={user}
          portfolio={portfolio}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  user={user}
                  portfolio={portfolio}
                  onRefreshPortfolio={refreshPortfolio}
                  onOpenAuth={() => setShowAuthModal(true)}
                />
              }
            />
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
            <Route path="/orders" element={<OrdersHistoryPage />} />
            <Route path="/journal" element={<TradeJournalPage assets={assets} />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#0B0F17]">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p>
              We Trade &copy; {new Date().getFullYear()} — Educational Paper Trading Platform. Built with React, TypeScript & FastAPI.
            </p>
            <p className="text-[11px] text-slate-600">
              Virtual simulated funds only. Not registered with SEBI or any regulatory agency. No real investments or returns.
            </p>
          </div>
        </footer>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              bootstrap();
            }}
          />
        )}
      </div>
    </BrowserRouter>
  );
};
