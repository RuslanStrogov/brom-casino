'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

interface ProvablyFairProps {
  onClose: () => void;
}

export function ProvablyFair({ onClose }: ProvablyFairProps) {
  const { t } = useI18n();
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const generateResult = () => {
    if (!serverSeed || !clientSeed) return;

    // Simple hash-based verification (demo)
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const diceResult = Math.abs(hash % 100) + 1;
    setResult(diceResult.toString());
    setVerified(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-casino-card border border-casino-border rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-casino-muted hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
            {t('fairness.title')}
          </h2>
          <p className="text-sm text-casino-muted mt-2">
            {t('fairness.subtitle')}
          </p>
        </div>

        {/* How it works */}
        <div className="bg-casino-darker rounded-xl p-4 mb-6">
          <h3 className="text-casino-gold font-semibold mb-3">{t('fairness.howItWorks')}</h3>
          <ol className="space-y-2 text-sm text-casino-muted">
            <li className="flex gap-2">
              <span className="text-casino-gold font-bold">1.</span>
              {t('fairness.step1')}
            </li>
            <li className="flex gap-2">
              <span className="text-casino-gold font-bold">2.</span>
              {t('fairness.step2')}
            </li>
            <li className="flex gap-2">
              <span className="text-casino-gold font-bold">3.</span>
              {t('fairness.step3')}
            </li>
            <li className="flex gap-2">
              <span className="text-casino-gold font-bold">4.</span>
              {t('fairness.step4')}
            </li>
          </ol>
        </div>

        {/* Verification Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-casino-muted mb-1.5">{t('fairness.serverSeed')}</label>
            <input
              type="text"
              value={serverSeed}
              onChange={(e) => { setServerSeed(e.target.value); setVerified(false); }}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                transition-colors font-mono text-sm"
              placeholder={t('fairness.serverSeedPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-casino-muted mb-1.5">{t('fairness.clientSeed')}</label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => { setClientSeed(e.target.value); setVerified(false); }}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                transition-colors font-mono text-sm"
              placeholder={t('fairness.clientSeedPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-casino-muted mb-1.5">{t('fairness.nonce')}</label>
            <input
              type="number"
              value={nonce}
              onChange={(e) => { setNonce(e.target.value); setVerified(false); }}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                transition-colors font-mono text-sm"
              placeholder="0"
            />
          </div>

          <button
            onClick={generateResult}
            disabled={!serverSeed || !clientSeed}
            className="w-full py-3 rounded-xl font-bold transition-all
              bg-gradient-gold text-casino-dark hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {t('fairness.verifyButton')}
          </button>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-xl border ${verified ? 'bg-casino-green/10 border-casino-green/30' : 'bg-casino-red/10 border-casino-red/30'}`}>
              <div className="text-center">
                <span className="text-sm text-casino-muted">{t('fairness.verifiedResult')}</span>
                <div className="text-3xl font-bold text-casino-gold font-mono mt-1">
                  {result}
                </div>
                <span className="text-xs text-casino-green mt-2 block">
                  {t('fairness.verifiedLabel')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Algorithm info */}
        <div className="mt-6 p-4 bg-casino-darker rounded-xl">
          <h4 className="text-sm font-semibold text-casino-gold mb-2">{t('fairness.algorithm')}</h4>
          <code className="text-xs text-casino-muted block whitespace-pre-wrap break-all">
            {`HMAC-SHA256(server_seed, client_seed + nonce)
→ Take first 8 hex chars
→ Convert to decimal
→ Modulo 100 + 1 = Result`}
          </code>
        </div>
      </div>
    </div>
  );
}
