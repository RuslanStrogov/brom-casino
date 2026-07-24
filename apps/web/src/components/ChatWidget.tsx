'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatStore, type Action } from '@/stores/chatStore';

// --- СИСТЕМА КОНТЕКСТНЫХ ПОДСКАЗОК ---

// Категории подсказок
const SUGGESTION_POOLS = {
  general: [
    { label: '🎲 Как играть?', text: 'Расскажи, как начать играть в казино. Какие игры есть и какие правила?' },
    { label: '💰 Пополнить', text: 'Как пополнить баланс и вывести выигрыш?' },
    { label: '🔒 Provably Fair', text: 'Как проверяется честность игр? Что такое Provably Fair?' },
    { label: '🎯 Стратегия', text: 'Дай совет по стратегии для игр. Как увеличить шансы на выигрыш?' },
  ],
  games: [
    { label: '🎰 Слоты', text: 'Покажи список слотов и провайдеров' },
    { label: '🎲 Кости (Dice)', text: 'Расскажи правила игры в Dice. Как делать ставки?' },
    { label: '💣 Mines', text: 'Как играть в Mines? Какая стратегия?' },
    { label: '🎯 Plinko', text: 'Расскажи про Plinko. Какие настройки?' },
    { label: '🎡 Колесо', text: 'Какие игры с колесом есть?' },
    { label: '🎰 Лайв-казино', text: 'Какие игры с живыми дилерами есть?' },
  ],
  betting: [
    { label: '💰 Бонусы', text: 'Какие бонусы и акции сейчас доступны?' },
    { label: '📊 VIP', text: 'Расскажи про VIP программу и уровни' },
    { label: '🏆 Турниры', text: 'Есть ли турниры или гонки?' },
    { label: '📈 Ставки', text: 'Какие лимиты ставок?' },
    { label: '💳 Вывод', text: 'Как быстро вывести выигрыш?' },
  ],
  crypto: [
    { label: '₿ Крипта', text: 'Какие криптовалюты принимаете?' },
    { label: '⛓️ Блокчейн', text: 'Как работают транзакции в казино?' },
    { label: '🔐 Анонимность', text: 'Насколько анонимно можно играть?' },
  ],
  fun: [
    { label: '😂 Прикол', text: 'Расскажи что-то смешное про казино' },
    { label: '📚 История', text: 'Расскажи историю азартных игр' },
    { label: '🎬 Фильм', text: 'Посоветуй фильм про казино' },
    { label: '🍀 Удача', text: 'Почему одним везёт а другим нет?' },
  ],
  support: [
    { label: '🆘 Помощь', text: 'Как связаться со службой поддержки?' },
    { label: '⚠️ Проблема', text: 'У меня проблема с игрой/выводом' },
    { label: '📋 Правила', text: 'Напомни правила и условия казино' },
    { label: '🚫 Лимиты', text: 'Как установить лимиты на игру?' },
  ],
};

// Берём N случайных из массива
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Определяем контекст по URL + последнему сообщению в чате
function getContextSuggestions(
  pathname: string,
  messageCount: number,
  lastMessage?: string
): { label: string; text: string }[] {
  const allPools = { ...SUGGESTION_POOLS };

  // Если истории нет — общие подсказки + поддержка
  if (messageCount === 0) {
    return [
      ...pickRandom(allPools.general, 2),
      ...pickRandom(allPools.games, 2),
      ...pickRandom(allPools.support, 1),
    ];
  }

  // --- АНАЛИЗ ПОСЛЕДНЕГО СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ ---
  const msg = (lastMessage || '').toLowerCase();

  // 🎲 Dice / Кости
  if (/dice|кости|кубик|дайс/i.test(msg)) {
    return [
      { label: '🎲 Как играть в Dice', text: 'Расскажи правила игры в Dice подробно' },
      { label: '📈 Стратегия Мартингейл', text: 'Объясни стратегию Мартингейл для Dice' },
      { label: '⚡ Быстрая стратегия', text: 'Какая самая простая стратегия для Dice?' },
      { label: '🔢 Вероятности', text: 'Какие шансы выиграть в Dice на разных множителях?' },
    ];
  }

  // 💣 Mines
  if (/mines|мины|мина|бомб/i.test(msg)) {
    return [
      { label: '💣 Как играть в Mines', text: 'Расскажи правила Mines' },
      { label: '🎯 Стратегия Mines', text: 'Какая стратегия лучше для Mines?' },
      { label: '📊 Риск vs Награда', text: 'Сколько алмазов открывать для оптимального риска?' },
      { label: '🔢 Вероятности', text: 'Какие шансы угадать в Mines?' },
    ];
  }

  // 🎯 Plinko
  if (/plinko|плинко/i.test(msg)) {
    return [
      { label: '🎯 Как играть в Plinko', text: 'Расскажи правила Plinko' },
      { label: '⚙️ Настройки Plinko', text: 'Какие настройки риска выбрать в Plinko?' },
      { label: '📈 Стратегия Plinko', text: 'Какая стратегия для Plinko самая прибыльная?' },
      { label: '🎡 Много рядов', text: 'Стоит ли играть с 16 рядами в Plinko?' },
    ];
  }

  // 🎰 Слоты
  if (/слот|slot|автомат|провайдер|игр/i.test(msg)) {
    return [
      { label: '🎰 Популярные слоты', text: 'Какие слоты сейчас самые популярные?' },
      { label: '🏢 Провайдеры', text: 'Какие провайдеры слотов доступны?' },
      { label: '💰 RTP слотов', text: 'Что такое RTP и как выбрать слот с высоким RTP?' },
      { label: '🎰 Pragmatic Play', text: 'Какие слоты Pragmatic Play есть?' },
      { label: '🔥 Новинки', text: 'Какие новые слоты появились?' },
    ];
  }

  // 💰 Бонусы / Акции
  if (/бонус|акци|promo|промо|кешбэк|cashback|фриспин|бесплат/i.test(msg)) {
    return [
      { label: '💰 Приветственный бонус', text: 'Что даёт приветственный бонус?' },
      { label: '🔄 Кэшбэк', text: 'Как работает кэшбэк?' },
      { label: '🎁 Фриспины', text: 'Как получить фриспины?' },
      { label: '🏆 VIP программа', text: 'Расскажи про VIP уровни и привилегии' },
    ];
  }

  // 💳 Пополнение / Вывод
  if (/пополн|вывод|депозит|пополнить|вывести|деньг|баланс/i.test(msg)) {
    return [
      { label: '💳 Как пополнить', text: 'Как пополнить баланс?' },
      { label: '💸 Как вывести', text: 'Как вывести выигрыш?' },
      { label: '⏱️ Скорость вывода', text: 'Как быстро обрабатываются выводы?' },
      { label: '₿ Криптовалюты', text: 'Какие криптовалюты принимаются?' },
      { label: '📋 Лимиты', text: 'Какие лимиты на вывод?' },
    ];
  }

  // 🔒 Безопасность / Provably Fair
  if (/честн|fair|provably|безопасн|провер|анонимн/i.test(msg)) {
    return [
      { label: '🔒 Provably Fair', text: 'Как работает Provably Fair?' },
      { label: '🔐 Анонимность', text: 'Насколько анонимно можно играть?' },
      { label: '🛡️ Безопасность', text: 'Как защищены мои данные?' },
      { label: '📋 Лицензия', text: 'Есть ли у казино лицензия?' },
    ];
  }

  // 🏆 Турниры
  if (/турнир|гонк|соревнован|лидерборд|leaderboard/i.test(msg)) {
    return [
      { label: '🏆 Активные турниры', text: 'Какие турниры сейчас идут?' },
      { label: '📊 Таблица лидеров', text: 'Покажи таблицу лидеров' },
      { label: '🎁 Призы', text: 'Какие призы в турнирах?' },
      { label: '📋 Правила турниров', text: 'Как участвовать в турнирах?' },
    ];
  }

  // Стратегия
  if (/стратег|мартингейл|ставк|совет|как выигра/i.test(msg)) {
    return [
      { label: '🎯 Мартингейл', text: 'Объясни стратегию Мартингейл' },
      { label: '📈 Анти-Мартингейл', text: 'Что такое стратегия Анти-Мартингейл?' },
      { label: '💰 Фиксированная ставка', text: 'Как работает стратегия фиксированной ставки?' },
      { label: "🔄 Д'Аламбер", text: "Объясни стратегию Д'Аламбера" },
    ];
  }

  // 🎡 Wheel / Колесо
  if (/колес|wheel|рулетк|roulette/i.test(msg)) {
    return [
      { label: '🎡 Как играть', text: 'Расскажи правила игры в колесо/рулетку' },
      { label: '🎯 Стратегия', text: 'Какая стратегия для колеса?' },
      { label: '🔴🔵 Ставки', text: 'На какие сектора лучше ставить?' },
      { label: '📊 Вероятности', text: 'Какие шансы выиграть в колесе?' },
    ];
  }

  // Лайв-казино
  if (/лайв|live|дилер|жив/i.test(msg)) {
    return [
      { label: '🎰 Лайв-игры', text: 'Какие игры с живыми дилерами есть?' },
      { label: '🎲 Лайв рулетка', text: 'Расскажи про лайв рулетку' },
      { label: '🃏 Лайв блэкджек', text: 'Как играть в лайв блэкджек?' },
      { label: '📺 Трансляция', text: 'Как работает лайв-казино?' },
    ];
  }

  // Общие вопросы про казино
  if (/казин|что такое|как работ/i.test(msg)) {
    return [
      ...pickRandom(allPools.general, 2),
      ...pickRandom(allPools.games, 1),
      ...pickRandom(allPools.support, 1),
    ];
  }

  // --- КОНТЕКСТ ПО URL (если сообщение не распознано) ---
  if (pathname.includes('/games') || pathname.includes('/slots')) {
    return pickRandom([...allPools.games, ...allPools.betting, ...allPools.general], 5);
  }
  if (pathname.includes('/wallet')) {
    return pickRandom([...allPools.betting, ...allPools.crypto, ...allPools.support], 5);
  }
  if (pathname.includes('/favorites')) {
    return pickRandom([...allPools.games, ...allPools.general], 4);
  }
  if (pathname.includes('/admin')) {
    return [
      { label: '📊 Статистика', text: 'Покажи статистику платформы' },
      { label: '👥 Пользователи', text: 'Сколько активных пользователей?' },
      { label: '💰 Финансы', text: 'Как финансовая ситуация?' },
    ];
  }
  if (pathname === '/' || pathname === '') {
    return pickRandom([...allPools.general, ...allPools.games, ...allPools.fun], 5);
  }

  // По умолчанию — всё подряд
  const all = Object.values(allPools).flat();
  return pickRandom(all, 5);
}

export function ChatWidget() {
  const {
    messages, isOpen, isLoading, isConnected, setOpen,
    sendMessage, setActionFeedback,
  } = useChatStore();

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState(() => getContextSuggestions(pathname, 0));

  // Обновляем подсказки при изменении контекста (URL, последнее сообщение)
  useEffect(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    setSuggestions(getContextSuggestions(pathname, messages.length, lastUserMsg?.text));
  }, [pathname, messages.length]);

  const lastProcessedActionRef = useRef<string | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Выполнение action от AI
  const executeAction = (action: Action, msgId: string) => {
    // sessionStorage — защита от повторного редиректа после перезагрузки
    const processed = sessionStorage.getItem('brom-ai-processed-' + msgId);
    if (processed) return;
    sessionStorage.setItem('brom-ai-processed-' + msgId, 'true');

    switch (action.type) {
      case 'navigate': {
        const path = action.payload.path || '/games';
        setActionFeedback(`🚀 Перехожу в раздел...`);
        setOpen(false);
        setTimeout(() => { router.push(path); }, 500);
        break;
      }
      case 'open_game': {
        const gameId = action.payload.gameId || 'slots';
        setActionFeedback(`🎮 Открываю игру "${action.payload.name || gameId}"...`);
        setOpen(false);
        setTimeout(() => { router.push(`/games/${gameId}`); }, 500);
        break;
      }
      case 'suggest_bet': {
        const amount = action.payload.amount || 100;
        const game = action.payload.game || 'slots';
        const msg = action.payload.message || `Рекомендую поставить ${amount}₽ на ${game}`;
        setActionFeedback(`💰 ${msg}`);
        break;
      }
      case 'simulate_spin': {
        const bet = action.payload.bet || 100;
        setActionFeedback(`🎰 Кручу слот со ставкой ${bet}₽...`);
        break;
      }
      case 'highlight': {
        const element = action.payload.element;
        const text = action.payload.text || '';
        setActionFeedback(`👆 ${text}`);
        setTimeout(() => {
          const el = document.querySelector(`[data-highlight="${element}"], #${element}, .${element}`);
          if (el) {
            el.classList.add('ring-2', 'ring-pink-500', 'ring-offset-2', 'ring-offset-gray-900', 'animate-pulse');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-pink-500', 'ring-offset-2', 'ring-offset-gray-900', 'animate-pulse');
            }, 5000);
          }
        }, 300);
        break;
      }
    }
  };

  // Автоматически выполняем action при получении нового сообщения от AI с action
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'bot' && lastMsg.action && lastMsg.id !== lastProcessedActionRef.current) {
      lastProcessedActionRef.current = lastMsg.id;
      executeAction(lastMsg.action, lastMsg.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Слушаем кастомное событие toggle-chat из MobileBottomNav
  useEffect(() => {
    const handler = () => setOpen(!isOpen);
    window.addEventListener('toggle-chat', handler);
    return () => window.removeEventListener('toggle-chat', handler);
  }, [isOpen, setOpen]);

  // Очищаем таймаут при размонтировании
  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, []);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Первое сообщение — приветствие, показываем если истории нет
  const hasHistory = messages.length > 0;

  if (!isOpen) return null;

  return (
    <>
      <div
        data-chat-panel
        className="fixed top-16 md:top-20 right-2.5 bottom-2.5 z-40 w-[36rem] max-w-[calc(100vw-20px)] bg-gradient-to-r from-transparent via-[rgba(10,10,20,0.5)] to-[rgba(10,10,20,0.98)] backdrop-blur-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 animate-slide-in-right rounded-2xl"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-heading font-semibold text-white">BROM AI</h3>
              <p className="text-[10px] text-gray-500">
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

        {/* Поле ввода — СВЕРХУ чата */}
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-pink-500/30 transition-all shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Спросить BROM AI..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,45,149,0.3)] transition-all shrink-0"
            >
              {/* AI Sparkle icon — тематика ИИ + азарт */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.673-1.673L13 18.5l1.433-.394a2.25 2.25 0 001.673-1.673L16.5 15l.394 1.433a2.25 2.25 0 001.673 1.673L20 18.5l-1.433.394a2.25 2.25 0 00-1.673 1.673z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Быстрые предложения — облаком/тегами, размер по содержимому */}
        <div className="px-4 py-1.5 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                className="px-3 py-1.5 text-xs text-gray-300 bg-white/[0.06] hover:bg-pink-500/20 hover:text-pink-200 rounded-full transition-all shadow-sm active:scale-[0.95] border border-white/[0.06] hover:border-pink-500/30 whitespace-nowrap"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Сообщения — flex-1 + flex-col-reverse (новые сообщения сверху) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-custom flex flex-col-reverse">
          {/* Индикатор печатания — появляется вверху над новыми сообщениями */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Сообщения — в обратном порядке, новые сверху */}
          {hasHistory && (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-br-md shadow-sm'
                          : 'bg-white/5 text-gray-200 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  {/* Кнопки под ответом AI — облаком/тегами, как подсказки ввода */}
                  {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s.action)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs text-gray-300 bg-white/[0.06] hover:bg-pink-500/20 hover:text-pink-200 rounded-full transition-all shadow-sm active:scale-[0.95] border border-white/[0.06] hover:border-pink-500/30 whitespace-nowrap disabled:opacity-50"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Пустое состояние — приветствие (только когда нет истории) */}
          {!hasHistory && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-heading font-medium text-white">BROM AI Ассистент</p>
                <p className="text-xs text-gray-400 mt-1">
                  Привет! Я — AI-ассистент BROM BET.<br />
                  Помогу с правилами, стратегией и отвечу на вопросы.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}