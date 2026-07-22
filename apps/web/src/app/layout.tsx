import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { GameProvider } from '@/providers/GameProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = localFont({
  src: [
    { path: './fonts/Inter.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-Variable.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = localFont({
  src: [
    { path: './fonts/PlayfairDisplay.woff2', weight: '400 900', style: 'normal' },
  ],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = localFont({
  src: [
    { path: './fonts/Outfit.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Outfit-Variable.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brom Casino - Premium Crypto Casino',
  description: 'The premier crypto casino experience. Provably fair games, instant payouts, and the best odds in the house.',
  keywords: ['casino', 'crypto', 'gambling', 'provably fair', 'bitcoin'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BROM BET',
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

        {/* PWA Service Worker */}
        <Script id="register-sw" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`}
        </Script>

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