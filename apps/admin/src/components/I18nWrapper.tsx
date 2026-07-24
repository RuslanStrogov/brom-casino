'use client';

import { useEffect } from 'react';
import { I18nProvider, useI18n } from '@/i18n/I18nProvider';

function LangSyncer({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
}

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <LangSyncer>{children}</LangSyncer>
    </I18nProvider>
  );
}