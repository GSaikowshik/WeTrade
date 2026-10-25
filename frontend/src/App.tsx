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
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
        <Navbar
          user={user}
          portfolio={portfolio}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
          onResetSimulation={() => {
            refreshPortfolio();
          }}
        />

        <div className="md:pl-60">
          <main className="relative pt-14 w-full px-space-lg bg-surface">
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
export default App;
