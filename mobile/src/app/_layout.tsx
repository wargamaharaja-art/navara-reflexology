import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isLoading, checkSession, token } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    checkSession().then(() => {
      setTimeout(() => setIsReady(true), 1000);
    });
  }, []);

  useEffect(() => {
    if (isReady && !isLoading) {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isReady, isLoading, token]);

  if (!isReady || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-mint-primary">
        <Text className="text-white text-3xl font-bold">Navara</Text>
        <Text className="text-white/80 text-lg font-medium mt-2">Clinic Operations</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-visit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-expense" options={{ presentation: 'modal' }} />
        <Stack.Screen name="clock-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </QueryClientProvider>
  );
}
