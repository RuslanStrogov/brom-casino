import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Outfit } from 'next/font/google';
import Script from 'next/script';
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

        {/* Yandex.Metrika */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=110928475','ym');ym(110928475,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
        </Script>
        <noscript>
          <img src="https://mc.yandex.ru/watch/110928475" style={{position:'absolute',left:-9999}} alt="" />
        </noscript>
      </body>
    </html>
  );
}
