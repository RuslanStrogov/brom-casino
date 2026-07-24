'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 mt-auto border-t border-white/5 bg-[rgba(10,10,15,0.9)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-miami flex items-center justify-center text-base font-bold text-white shadow-neon-purple">
                🎰
              </div>
              <span className="text-lg font-heading font-bold">
                <span className="bg-gradient-miami bg-clip-text text-transparent">BROM</span>
                <span className="text-white/80"> CASINO</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {t('footer.brand', 'The premier crypto casino experience with provably fair games, instant payouts, and the best odds.')}
            </p>
            {/* Provider badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] bg-miami-purple/20 text-miami-purple border border-miami-purple/30">
                Pragmatic Play
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-miami-cyan/20 text-miami-cyan border border-miami-cyan/30">
                Crypto
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-miami-pink/20 text-miami-pink border border-miami-pink/30">
                KYC
              </span>
            </div>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-miami-pink font-heading font-semibold mb-4 text-sm md:text-base">{t('footer.games', 'Games')}</h3>
            <ul className="space-y-2.5">
              {['game.slots', 'game.crash', 'game.dice', 'game.roulette', 'game.blackjack', 'game.plinko'].map((gameKey) => (
                <li key={gameKey}>
                  <Link
                    href="/#games"
                    className="text-sm text-gray-500 hover:text-miami-cyan transition-colors duration-200"
                  >
                    {t(gameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-miami-cyan font-heading font-semibold mb-4 text-sm md:text-base">{t('footer.info', 'Info')}</h3>
            <ul className="space-y-2.5">
              {[
                { href: '#provably-fair', label: t('footer.provablyFair', 'Provably Fair') },
                { href: '#', label: t('footer.terms', 'Terms of Service') },
                { href: '#', label: t('footer.privacy', 'Privacy Policy') },
                { href: '#', label: t('footer.responsibleGaming', 'Responsible Gaming') },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-miami-cyan transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-miami-purple font-heading font-semibold mb-4 text-sm md:text-base">{t('footer.support', 'Support')}</h3>
            <ul className="space-y-2.5">
              {[
                { href: '#', label: t('footer.helpCenter', 'Help Center') },
                { href: '#', label: t('footer.contactUs', 'Contact Us') },
                { href: '#', label: t('footer.faq', 'FAQ') },
                { href: 'https://t.me/bromcasino', label: t('footer.telegram', 'Telegram'), external: true },
              ].map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-miami-cyan transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-miami-cyan transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 md:mt-14 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Brom Casino. {t('footer.rights', 'All rights reserved')}. 18+ Only.
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[
              { icon: '🔒', label: t('footer.ssl', 'SSL Secured') },
              { icon: '🛡️', label: t('footer.fair', 'Provably Fair') },
              { icon: '⚡', label: t('footer.instantPayouts', 'Instant Payouts') },
              { icon: '🎰', label: t('footer.gamesCount', '6+ Games') },
            ].map((item) => (
              <span key={item.label} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span>{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}