'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';

// Тематические быстрые действия
const SUGGESTIONS = [
  { label: '🎲 Как играть?', text: 'Расскажи, как начать играть в казино. Какие игры есть и какие правила?' },
  { label: '💰 Пополнить', text: 'Как пополнить баланс и вывести выигрыш?' },
  { label: '🎯 Стратегия', text: 'Дай совет по стратегии для игры в рулетку или кости. Как увеличить шансы?' },
  { label: '🔒 Безопасность', text: 'Как проверяется честность игр? Что такое Provably Fair?' },
];

export function ChatWidget() {
  const {
    messages, isOpen, isLoading, isConnected, setOpen,
    connect, disconnect, sendMessage, isTyping,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Подключаемся при монтировании
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Фокус на инпут при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage(text.trim());
    setInput('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Если нет ключа Tidio — показываем наш AI чат
  // Или всегда показываем AI чат

  return (
    <>
      {/* FAB — плавающая кнопка чата */}
      <button
        onClick={() => setOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 scale-110'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-110 hover:shadow-pink-500/50'
        }`}
        aria-label={isOpen ? 'Закрыть чат' : 'Чат поддержки'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
            <circle cx="12" cy="11" r="1.5" />
            <circle cx="16" cy="11" r="1.5" />
            <circle cx="8" cy="11" r="1.5" />
          </svg>
        )}
      </button>

      {/* Панель чата */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[rgba(12,12,25,0.97)] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: 'min(600px, calc(100vh - 140px))' }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">BROM AI</h3>
              <p className="text-[10px] text-gray-400">
                {isConnected ? 'Онлайн' : 'Подключение...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ height: '350px', maxHeight: 'calc(100% - 140px)' }}>
          {messages.length === 0 ? (
            /* Пустое состояние — приветствие */
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">BROM AI Ассистент</p>
                <p className="text-xs text-gray-400 mt-1">
                  Привет! Я — AI-ассистент BROM BET.<br />
                  Помогу с правилами, стратегией и отвечу на вопросы.
                </p>
              </div>
            </div>
          ) : (
            /* Сообщения */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-br-md'
                      : 'bg-white/5 text-gray-200 rounded-bl-md border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {/* Индикатор печатания */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Быстрые предложения */}
        {showSuggestions && messages.length === 0 && (
          <div className="px-4 pb-2 grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                className="px-3 py-2 text-xs text-left text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl border border-white/5 transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Поле ввода */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спросить BROM AI..."
              className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,45,149,0.3)] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}