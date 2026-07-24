import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { I18nWrapper } from '../components/I18nWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BROM Casino Admin',
  description: 'Admin panel for BROM Casino',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0a0f] text-gray-100 antialiased`}>
        <I18nWrapper>{children}</I18nWrapper>
      </body>
    </html>
  );
}