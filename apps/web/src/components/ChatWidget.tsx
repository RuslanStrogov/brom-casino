'use client';

import Script from 'next/script';

const TIDIO_PUBLIC_KEY = process.env.NEXT_PUBLIC_TIDIO_KEY || '';

export function ChatWidget() {
  if (!TIDIO_PUBLIC_KEY) {
    // Fallback: show a simple floating button that opens a mailto
    return (
      <a
        href="mailto:support@brombet.ru"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 transition-all hover:scale-110 hover:shadow-pink-500/50"
        aria-label="Support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z" />
        </svg>
      </a>
    );
  }

  return (
    <Script
      id="tidio-chat"
      src={`//code.tidio.co/${TIDIO_PUBLIC_KEY}.js`}
      strategy="lazyOnload"
      async
    />
  );
}