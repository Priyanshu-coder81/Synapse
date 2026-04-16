import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  setAuth: (username: string, userId: string, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('accessToken'),
  username: localStorage.getItem('username'),
  userId: localStorage.getItem('userId'),
  
  setAuth: (username, userId, access, refresh) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
    set({ isAuthenticated: true, username, userId });
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    set({ isAuthenticated: false, username: null, userId: null });
  }
}));
