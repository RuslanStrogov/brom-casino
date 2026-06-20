'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-casino-darker border-t border-casino-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎰</span>
              <span className="text-xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
                Brom Casino
              </span>
            </Link>
            <p className="text-sm text-casino-muted">
              The premier crypto casino experience with provably fair games and instant payouts.
            </p>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-4">Games</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Slots</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Crash</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Dice</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Plinko</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Provably Fair</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Responsible Gaming</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-casino-gold font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-sm text-casino-muted hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-casino-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-casino-muted">
            © {new Date().getFullYear()} Brom Casino. All rights reserved. 18+ Only.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-casino-muted">🔒 SSL Secured</span>
            <span className="text-xs text-casino-muted">🛡️ Provably Fair</span>
            <span className="text-xs text-casino-muted">⚡ Instant Payouts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
