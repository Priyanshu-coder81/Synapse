import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  email: string | null;
  setAuth: (username: string, userId: string, accessToken: string, refreshToken: string, email?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('accessToken'),
  username: localStorage.getItem('username'),
  userId: localStorage.getItem('userId'),
  email: localStorage.getItem('email'),
  
  setAuth: (username, userId, access, refresh, email) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
    if (email) localStorage.setItem('email', email);
    set({ isAuthenticated: true, username, userId, email: email || null });
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    set({ isAuthenticated: false, username: null, userId: null, email: null });
  }
}));
