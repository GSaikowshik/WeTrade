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
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
        <Navbar
          user={user}
          portfolio={portfolio}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        <div className="md:pl-60 pt-14 flex-1 flex flex-col justify-between">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

          <footer className="border-t border-surface-container-high/60 py-6 text-center text-xs text-text-tertiary bg-surface-container-lowest mt-12">
            <div className="max-w-7xl mx-auto px-4 space-y-1">
              <p className="font-medium text-text-secondary">
                We Trade &copy; {new Date().getFullYear()} — Virtual Simulated Trading & Market Learning Platform for Indian Equities.
              </p>
              <p className="text-[11px] text-text-tertiary">
                Virtual simulated funds only. Not registered with SEBI or any regulatory agency. No real financial investments or monetary liabilities.
              </p>
            </div>
          </footer>
        </div>

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
