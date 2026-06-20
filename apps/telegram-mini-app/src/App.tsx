import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useTelegram } from './hooks/useTelegram';
import { useAuth } from './hooks/useAuth';
import GameList from './components/GameList';
import SlotGame from './components/SlotGame';
import CrashGame from './components/CrashGame';
import BalanceCard from './components/BalanceCard';
import DepositModal from './components/DepositModal';
import WithdrawModal from './components/WithdrawModal';

const TON_MANIFEST_URL = import.meta.env.VITE_TON_MANIFEST_URL || '';

function AppContent() {
  const { ready, user, themeParams, expand, hapticImpact } = useTelegram();
  const { isAuthenticated, isLoading, token } = useAuth();
  const [showDeposit, setShowDeposit] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);

  React.useEffect(() => {
    ready();
    expand();
  }, [ready, expand]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-casino-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-500 text-lg font-medium">Loading BROM Casino...</p>
        </div>
      </div>
    );
  }

  const bgColor = themeParams?.bg_color || '#0f0f23';
  const textColor = themeParams?.text_color || '#ffffff';

  return (
    <div
      className="min-h-screen pb-8 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-casino-darker/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
              B
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              BROM Casino
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-white/60">
                @{user.username || user.first_name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <BalanceCard
          onDeposit={() => {
            hapticImpact('medium');
            setShowDeposit(true);
          }}
          onWithdraw={() => {
            hapticImpact('medium');
            setShowWithdraw(true);
          }}
        />

        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/games/slot/:id" element={<SlotGame />} />
          <Route path="/games/crash" element={<CrashGame />} />
        </Routes>
      </main>

      {/* Modals */}
      <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </div>
  );
}

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={TON_MANIFEST_URL}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}
