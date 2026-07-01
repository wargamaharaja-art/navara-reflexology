import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Uses local IP for mobile devices, and localhost for web browser to avoid CORS issues
export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3001/api' 
  : 'http://192.168.1.22:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  let token = null;
  if (Platform.OS === 'web') {
    token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
  } else {
    token = await SecureStore.getItemAsync('auth_token');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
