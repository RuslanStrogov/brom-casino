'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SlotsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#games');
  }, [router]);

  return (
    <div className="min-h-screen bg-miami-sky flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}