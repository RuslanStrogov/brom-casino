'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';

export default function SlotsRedirect() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.replace('/#games');
  }, [router]);

  return (
    <div className="min-h-screen bg-miami-sky flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">{t('common.redirecting')}</p>
      </div>
    </div>
  );
}