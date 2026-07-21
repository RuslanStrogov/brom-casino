import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { GameProvider } from '@/providers/GameProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Brom Casino - Premium Crypto Casino',
  description: 'The premier crypto casino experience. Provably fair games, instant payouts, and the best odds in the house.',
  keywords: ['casino', 'crypto', 'gambling', 'provably fair', 'bitcoin'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Brom Casino',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${outfit.variable}`}>
      <body className="bg-casino-dark text-white font-sans min-h-screen flex flex-col no-tap-highlight overflow-x-hidden">
        <AuthProvider>
          <GameProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
