import { create } from 'zustand';
import { User, Driver, ApiResponse } from '@rydo/shared';

interface AuthState {
  token: string | null;
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  login: (credentials: any) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  checkMe: () => Promise<void>;
}

const API_URL = 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('rydo_token'),
  user: null,
  driver: null,
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('rydo_token', token);
    } else {
      localStorage.removeItem('rydo_token');
    }
    set({ token });
  },

  setError: (error) => set({ error }),

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data: ApiResponse<any> = await res.json();
      if (data.success && data.data) {
        const { token, user } = data.data;
        get().setToken(token);
        set({ user, loading: false });
        await get().checkMe();
        return true;
      } else {
        set({ error: data.error || 'Failed to login', loading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data: ApiResponse<any> = await res.json();
      if (data.success && data.data) {
        const { token, user } = data.data;
        get().setToken(token);
        set({ user, loading: false });
        await get().checkMe();
        return true;
      } else {
        set({ error: data.error || 'Failed to signup', loading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  logout: () => {
    get().setToken(null);
    set({ user: null, driver: null, error: null });
  },

  checkMe: async () => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ApiResponse<any> = await res.json();
      if (data.success && data.data) {
        set({
          user: data.data.user,
          driver: data.data.driver || null,
          loading: false
        });
      } else {
        get().logout();
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  }
}));
