import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AdminShell from '../components/AdminShell';

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}