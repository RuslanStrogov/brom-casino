import { api } from './api';

const TOKEN_KEY = 'brom_casino_token';
const USER_KEY = 'brom_casino_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth(): void {
  removeStoredToken();
  removeStoredUser();
}

export async function login(username: string, password: string): Promise<{ token: string; user: any }> {
  const data = await api.login(username, password);
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function register(username: string, password: string): Promise<{ token: string; user: any }> {
  const data = await api.register(username, password);
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchProfile(): Promise<any> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');
  return api.getProfile(token);
}

export async function fetchBalance(): Promise<number> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');
  const data = await api.getBalance(token);
  return data.balance;
}
