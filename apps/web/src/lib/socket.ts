'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || '/socket.io/';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
    // Expose for useGame hook fallback
    (window as any).__brom_socket = socket;
  }
  return socket;
}

export function connectSocket(token: string): void {
  const s = getSocket();
  if (s.connected) return;
  s.auth = { token };
  s.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    setConnected(s.connected);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export function useSocketEvent(event: string, callback: (...args: any[]) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

export interface GameResult {
  id: string;
  game: string;
  betAmount: number;
  winAmount: number;
  multiplier?: number;
  result?: Record<string, unknown>;
  balance: number;
}

export interface BalanceUpdate {
  balance: number;
  change: number;
}

export interface CrashUpdate {
  multiplier: number;
  status: 'running' | 'crashed';
}
