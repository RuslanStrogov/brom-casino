'use client';

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface ChatState {
  // Состояние
  messages: ChatMessage[];
  isOpen: boolean;
  isConnected: boolean;
  isLoading: boolean;
  userId: string;
  conversationId: string | null;

  // Действия
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addMessage: (msg: ChatMessage) => void;
  addChunk: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setConversationId: (id: string) => void;
  sendMessage: (text: string) => void;
  connect: () => void;
  disconnect: () => void;
}

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

// Определяем URL WebSocket
function getWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3004';
  // В продакшене используем wss, в dev — localhost
  if (window.location.hostname === 'brombet.ru') {
    return 'wss://brombet.ru/ws';
  }
  return 'ws://localhost:3004/ws';
}

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isOpen: false,
  isConnected: false,
  isLoading: false,
  userId: getUserId(),
  conversationId: null,

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  addChunk: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.sender === 'bot') {
        msgs[msgs.length - 1] = { ...last, text: last.text + text };
      }
      return { messages: msgs };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConversationId: (id) => set({ conversationId: id }),

  connect: () => {
    const state = get();
    if (ws?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl();

    ws = new WebSocket(url);
    ws.onopen = () => {
      console.log('[BROM AI] WebSocket connected');
      set({ isConnected: true });
      // Отправляем userId серверу
      ws?.send(JSON.stringify({ type: 'setUser', userId: state.userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            set({ conversationId: data.sessionId || data.conversationId });
            break;
          case 'chunk':
            get().addChunk(data.text);
            break;
          case 'done':
            set({ isLoading: false });
            break;
          case 'error':
            get().addMessage({
              id: `err-${Date.now()}`,
              text: data.text || 'Произошла ошибка',
              sender: 'bot',
              timestamp: Date.now(),
            });
            set({ isLoading: false });
            break;
          case 'pong':
            break;
        }
      } catch (e) {
        console.error('[BROM AI] Failed to parse WS message', e);
      }
    };

    ws.onclose = () => {
      console.log('[BROM AI] WebSocket disconnected');
      set({ isConnected: false });
      // Авто-переподключение через 5 сек
      reconnectTimer = setTimeout(() => {
        if (get().isOpen) get().connect();
      }, 5000);
    };

    ws.onerror = (err) => {
      console.error('[BROM AI] WebSocket error', err);
    };
  },

  disconnect: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
    set({ isConnected: false });
  },

  sendMessage: (text: string) => {
    const state = get();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
    }));

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', text, userId: state.userId }));
    } else {
      // Fallback: REST API
      const restUrl = typeof window !== 'undefined' && window.location.hostname === 'brombet.ru'
        ? '/api/chat'
        : 'http://localhost:3004/api/chat';

      fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId: state.userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          get().addMessage({
            id: `bot-${Date.now()}`,
            text: data.text || '...',
            sender: 'bot',
            timestamp: Date.now(),
          });
          set({ isLoading: false });
        })
        .catch(() => {
          get().addMessage({
            id: `err-${Date.now()}`,
            text: 'Ошибка соединения. Попробуйте позже.',
            sender: 'bot',
            timestamp: Date.now(),
          });
          set({ isLoading: false });
        });
    }
  },
}));