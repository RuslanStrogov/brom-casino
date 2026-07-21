'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}