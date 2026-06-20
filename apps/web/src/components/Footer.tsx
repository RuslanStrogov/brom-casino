'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-casino-darker border-t border-casino-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎰</span>
              <span className="text-xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
                Brom Casino
              </span>
            </Link>
            <p className="text-sm text-casino-muted">
              The premier crypto casino experience with provably fair games and instant payouts.
            </p>
            {/* Provider badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Pragmatic Play
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">
                Cryptomus
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Sumsub KYC
              </span>
            </div>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-3 md:mb-4 text-sm md:text-base">Games</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Slots</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Crash</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Dice</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Roulette</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Blackjack</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Plinko</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-3 md:mb-4 text-sm md:text-base">Information</h3>
            <ul className="space-y-2">
              <li><Link href="#provably-fair" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Provably Fair</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Responsible Gaming</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-3 md:mb-4 text-sm md:text-base">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">FAQ</Link></li>
              <li>
                <a href="https://t.me/bromcasino" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-casino-muted hover:text-white transition-colors">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-casino-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-casino-muted">
            © {new Date().getFullYear()} Brom Casino. All rights reserved. 18+ Only.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-xs text-casino-muted">🔒 SSL Secured</span>
            <span className="text-xs text-casino-muted">🛡️ Provably Fair</span>
            <span className="text-xs text-casino-muted">⚡ Instant Payouts</span>
            <span className="text-xs text-casino-muted">🎰 6 Games</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
