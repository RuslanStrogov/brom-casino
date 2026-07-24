'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import {
  HiHome,
  HiSquares2X2,
  HiWallet,
  HiHeart,
  HiSparkles,
} from 'react-icons/hi2';

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.home', icon: HiHome },
  { href: '/games', labelKey: 'nav.games', icon: HiSquares2X2 },
  { href: '/wallet', labelKey: 'nav.wallet', icon: HiWallet },
  { href: '/favorites', labelKey: 'nav.favorites', icon: HiHeart },
  { href: '#chat', labelKey: 'nav.aiChat', icon: HiSparkles, isChat: true },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();

  const handleClick = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.isChat) {
      // Dispatch custom event to toggle chat widget
      window.dispatchEvent(new CustomEvent('toggle-chat'));
      return;
    }
    if (!isAuthenticated && item.href === '/wallet') {
      // Redirect to home with auth modal
      router.push('/');
      return;
    }
    router.push(item.href);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label={t('nav.mobileNav')}
    >
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-miami-pink/50 to-transparent" />

      <div className="relative bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-2 px-2 safe-area-bottom">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => handleClick(item)}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] min-h-[48px] ${
                  active
                    ? 'text-miami-pink'
                    : 'text-gray-500 hover:text-gray-300 active:text-miami-cyan'
                }`}
                aria-label={t(item.labelKey)}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-miami-pink to-miami-purple rounded-full" />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'scale-110' : ''
                  }`}
                />
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    active ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}