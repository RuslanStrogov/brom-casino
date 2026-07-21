'use client';

import { useEffect, useCallback } from 'react';

interface ErrorModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  code?: string;
}

export default function ErrorModal({
  open,
  title,
  message,
  onClose,
  onRetry,
  code,
}: ErrorModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95"
        style={{
          background: 'linear-gradient(135deg, #1a0a2e, #16213e)',
          border: '1px solid rgba(255, 45, 149, 0.3)',
          boxShadow: '0 0 40px rgba(255, 45, 149, 0.15), 0 0 80px rgba(0, 212, 255, 0.08)',
        }}
      >
        {/* Neon accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #ff2d95, #00d4ff, transparent)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          ✕
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4 mt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(255, 45, 149, 0.15)',
              border: '2px solid rgba(255, 45, 149, 0.3)',
            }}
          >
            ⚠️
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-center text-xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #ff2d95, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h2>

        {/* Error code */}
        {code && (
          <p className="text-center text-xs font-mono mb-3" style={{ color: 'rgba(255,45,149,0.6)' }}>
            {code}
          </p>
        )}

        {/* Message */}
        <p className="text-center text-sm text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ccc',
            }}
          >
            Закрыть
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #ff2d95, #ff6b9d)',
                color: '#000',
              }}
            >
              Повторить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
