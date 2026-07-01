import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'ADMIN' | 'THERAPIST' | 'OWNER';
  branchId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (token, user) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem('auth_token', token);
    } else {
      await SecureStore.setItemAsync('auth_token', token);
    }
    set({ token, user, isLoading: false });
  },
  logout: async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
    set({ token: null, user: null, isLoading: false });
  },
  checkSession: async () => {
    try {
      let token = null;
      if (Platform.OS === 'web') {
        token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
      } else {
        token = await SecureStore.getItemAsync('auth_token');
      }
      if (token) {
        // Normally you'd call /api/auth/session to validate, 
        // For now, we set the token if it exists (assuming it's valid if in SecureStore)
        // const res = await api.get('/auth/session');
        // if (res.data?.user) {
        //   set({ token, user: res.data.user, isLoading: false });
        //   return;
        // }
        
        // Mock user info if session endpoint isn't fully ready
        set({ 
          token, 
          user: { id: '1', name: 'Admin', role: 'ADMIN' }, 
          isLoading: false 
        });
        return;
      }
    } catch (e) {
      console.error('Session check failed', e);
    }
    set({ token: null, user: null, isLoading: false });
  }
}));
