import { useEffect, useState, useCallback } from 'react';
import type { TelegramWebApp, TelegramUser } from '../types/telegram';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  themeParams: TelegramWebApp['themeParams'] | null;
  initData: string;
  initDataUnsafe: TelegramWebApp['initDataUnsafe'] | null;
  isReady: boolean;
  colorScheme: 'light' | 'dark';
  platform: string;
  version: string;
  expand: () => void;
  ready: () => void;
  close: () => void;
  hapticImpact: (style?: 'light' | 'medium' | 'heavy') => void;
  hapticNotification: (type?: 'error' | 'success' | 'warning') => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string) => Promise<boolean>;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: string; text?: string }>;
  }) => void;
  showScanQrPopup: (params: { text?: string }) => void;
}

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      setWebApp(tg);
      setIsReady(true);
    } else {
      // Development fallback
      console.warn('Telegram WebApp SDK not available. Running in development mode.');
      setIsReady(true);
    }
  }, []);

  const expand = useCallback(() => {
    webApp?.expand();
  }, [webApp]);

  const ready = useCallback(() => {
    webApp?.ready();
  }, [webApp]);

  const close = useCallback(() => {
    webApp?.close();
  }, [webApp]);

  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    [webApp]
  );

  const hapticNotification = useCallback(
    (type: 'error' | 'success' | 'warning' = 'success') => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    [webApp]
  );

  const showAlert = useCallback(
    (message: string) => {
      return new Promise<void>(resolve => {
        if (webApp?.showAlert) {
          webApp.showAlert(message, () => resolve());
        } else {
          alert(message);
          resolve();
        }
      });
    },
    [webApp]
  );

  const showConfirm = useCallback(
    (message: string) => {
      return new Promise<boolean>(resolve => {
        if (webApp?.showConfirm) {
          webApp.showConfirm(message, (confirmed: boolean) => resolve(confirmed));
        } else {
          resolve(confirm(message));
        }
      });
    },
    [webApp]
  );

  const setHeaderColor = useCallback(
    (color: string) => {
      webApp?.setHeaderColor?.(color);
    },
    [webApp]
  );

  const setBackgroundColor = useCallback(
    (color: string) => {
      webApp?.setBackgroundColor?.(color);
    },
    [webApp]
  );

  const enableClosingConfirmation = useCallback(() => {
    webApp?.enableClosingConfirmation?.();
  }, [webApp]);

  const disableClosingConfirmation = useCallback(() => {
    webApp?.disableClosingConfirmation?.();
  }, [webApp]);

  const onEvent = useCallback(
    (eventType: string, callback: () => void) => {
      webApp?.onEvent?.(eventType, callback);
    },
    [webApp]
  );

  const offEvent = useCallback(
    (eventType: string, callback: () => void) => {
      webApp?.offEvent?.(eventType, callback);
    },
    [webApp]
  );

  const sendData = useCallback(
    (data: string) => {
      webApp?.sendData(data);
    },
    [webApp]
  );

  const openLink = useCallback(
    (url: string) => {
      webApp?.openLink(url);
    },
    [webApp]
  );

  const openTelegramLink = useCallback(
    (url: string) => {
      webApp?.openTelegramLink(url);
    },
    [webApp]
  );

  const showPopup = useCallback(
    (params: {
      title?: string;
      message: string;
      buttons?: Array<{ id?: string; type?: string; text?: string }>;
    }) => {
      webApp?.showPopup?.(params);
    },
    [webApp]
  );

  const showScanQrPopup = useCallback(
    (params: { text?: string }) => {
      webApp?.showScanQrPopup?.(params);
    },
    [webApp]
  );

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    themeParams: webApp?.themeParams || null,
    initData: webApp?.initData || '',
    initDataUnsafe: webApp?.initDataUnsafe || null,
    isReady,
    colorScheme: webApp?.colorScheme || 'dark',
    platform: webApp?.platform || 'web',
    version: webApp?.version || '6.0',
    expand,
    ready,
    close,
    hapticImpact,
    hapticNotification,
    showAlert,
    showConfirm,
    setHeaderColor,
    setBackgroundColor,
    enableClosingConfirmation,
    disableClosingConfirmation,
    onEvent,
    offEvent,
    sendData,
    openLink,
    openTelegramLink,
    showPopup,
    showScanQrPopup,
  };
}
