'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en, type TranslationKeys } from './locales/en';
import { ru } from './locales/ru';

export type SupportedLang = 'en' | 'ru';

const LOCALE_MAP: Record<SupportedLang, TranslationKeys> = { en, ru };
const STORAGE_KEY = 'brombet-lang';

interface I18nContextValue {
  lang: SupportedLang;
  t: (path: string, fallback?: string) => string;
  setLang: (lang: SupportedLang) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveNested(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>('ru');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
      if (saved && (saved === 'en' || saved === 'ru')) {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = useCallback((newLang: SupportedLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  }, []);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const locale = LOCALE_MAP[lang];
      const result = resolveNested(locale, path);
      if (typeof result === 'string') return result;
      // fallback to English
      const enResult = resolveNested(en, path);
      if (typeof enResult === 'string') return enResult;
      return fallback ?? path;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'en',
      t: (path: string, fallback?: string) => {
        const result = resolveNested(en, path);
        return (typeof result === 'string' ? result : fallback) ?? path;
      },
      setLang: () => {},
    };
  }
  return ctx;
}