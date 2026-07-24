'use client';

import { useEffect, useRef } from 'react';
import { Drawer } from 'vaul';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Если true — показывается от низа экрана на мобилках */
  fullWidth?: boolean;
  /** Снэп-поинты для частичного открытия */
  snapPoints?: (string | number)[];
}

/**
 * Мобильный Drawer на основе Vaul (Radix-совместимый bottom sheet).
 * Автоматически работает только на touch-устройствах.
 */
export function MobileDrawer({
  open,
  onClose,
  title,
  description,
  children,
  fullWidth = false,
  snapPoints,
}: MobileDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      snapPoints={snapPoints}
    >
      {/* Затемнение фона */}
      <Drawer.Overlay
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <Drawer.Portal>
        <Drawer.Content
          className={`fixed bottom-0 left-0 right-0 z-50 mx-auto flex flex-col rounded-t-[16px] bg-[rgba(18,18,30,0.98)] backdrop-blur-2xl border border-white/5 border-b-0 shadow-2xl ${
            fullWidth ? '' : 'max-w-lg'
          }`}
          style={{ maxHeight: '85dvh' }}
        >
          {/* Drag Handle */}
          <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-white/15 shrink-0" />

          {/* Заголовок */}
          {title && (
            <div className="px-5 pb-3 shrink-0">
              <Drawer.Title className="text-lg font-heading font-bold text-white">
                {title}
              </Drawer.Title>
              {description && (
                <Drawer.Description className="text-sm text-gray-400 mt-1">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}

          {/* Контент (скроллируемый) */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-custom">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}