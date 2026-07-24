'use client';

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  suggestions?: { label: string; action: string }[];
  action?: Action | null;
}

export interface Action {
  type: 'navigate' | 'suggest_bet' | 'simulate_spin' | 'open_game' | 'highlight';
  payload: Record<string, any>;
}

interface ChatState {
  // Состояние
  messages: ChatMessage[];
  isOpen: boolean;
  isConnected: boolean;
  isLoading: boolean;
  userId: string;
  conversationId: string | null;
  actionFeedback: string | null;

  // Действия
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setConversationId: (id: string) => void;
  sendMessage: (text: string) => void;
  clearHistory: () => void;
  setActionFeedback: (feedback: string | null) => void;
}

// Ключ для localStorage
const STORAGE_KEY = 'brombet-chat-history';

// Генерируем или получаем userId из localStorage
function getUserId(): string {
  if (typeof window === 'undefined') return 'anon';
  let id = localStorage.getItem('brombet-chat-user');
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
    localStorage.setItem('brombet-chat-user', id);
  }
  return id;
}

// Загружаем историю из localStorage
function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    // Фильтруем сообщения старше 7 дней
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return parsed.filter(m => m.timestamp > weekAgo);
  } catch {
    return [];
  }
}

// Сохраняем историю в localStorage
function saveHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    // Храним последние 100 сообщений
    const toSave = messages.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[BROM] Failed to save chat history:', e);
  }
}

// REST API URL
function getApiUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3004/api/chat';
  if (window.location.hostname === 'brombet.ru') {
    return '/api/chat';
  }
  return 'http://localhost:3004/api/chat';
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: loadHistory(),
  isOpen: false,
  isConnected: true, // REST всегда доступен
  isLoading: false,
  userId: getUserId(),
  conversationId: null,
  actionFeedback: null,

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addMessage: (msg) => {
    const newMessages = [...get().messages, msg];
    set({ messages: newMessages });
    saveHistory(newMessages);
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConversationId: (id) => set({ conversationId: id }),

  clearHistory: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ messages: [] });
  },

  setActionFeedback: (feedback) => set({ actionFeedback: feedback }),

  sendMessage: (text: string) => {
    const state = get();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    // Сразу добавляем сообщение пользователя и показываем загрузку
    const messagesWithUser = [...state.messages, userMsg];
    set({ messages: messagesWithUser, isLoading: true });
    saveHistory(messagesWithUser);

    // REST API запрос
    const apiUrl = getApiUrl();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, userId: state.userId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: data.text || '...',
          sender: 'bot',
          timestamp: Date.now(),
          suggestions: data.suggestions || [],
          action: data.action || null,
        };
        const newMessages = [...get().messages, botMsg];
        set({ messages: newMessages, isLoading: false });
        saveHistory(newMessages);
      })
      .catch((err) => {
        console.error('[BROM AI] REST error:', err);
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          text: 'Ошибка соединения. Попробуйте позже.',
          sender: 'bot',
          timestamp: Date.now(),
        };
        const newMessages = [...get().messages, errMsg];
        set({ messages: newMessages, isLoading: false });
        saveHistory(newMessages);
      });
  },
}));