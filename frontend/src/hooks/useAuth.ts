import { create } from 'zustand';
import { api } from '../lib/api.js';
import type { User } from '../types/index.js';

export interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.auth.login({ email, password });
      set({ user: response.user, isLoading: false });
      return response.user;
    } catch (err: any) {
      const msg = err.error || 'Failed to sign in. Please verify your credentials.';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      set({ user: null });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.auth.me();
      set({ user: response.user, isLoading: false });
      return response.user;
    } catch {
      set({ user: null, isLoading: false });
      return null;
    }
  },
}));
