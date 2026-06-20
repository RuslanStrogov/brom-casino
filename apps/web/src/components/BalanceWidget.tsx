'use client';

interface BalanceWidgetProps {
  balance: number;
  showActions?: boolean;
}

export function BalanceWidget({ balance, showActions = false }: BalanceWidgetProps) {
  return (
    <div className="flex items-center gap-3 bg-casino-card border border-casino-border rounded-xl px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">💰</span>
        <div className="flex flex-col">
          <span className="text-xs text-casino-muted leading-none">Balance</span>
          <span className="text-sm font-bold text-casino-gold font-mono">
            {balance.toFixed(2)}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-casino-border">
          <button
            className="p-1.5 rounded-lg hover:bg-casino-darker transition-colors text-casino-muted hover:text-casino-gold"
            title="Deposit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-casino-darker transition-colors text-casino-muted hover:text-casino-gold"
            title="Withdraw"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
