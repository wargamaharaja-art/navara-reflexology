import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, LogIn, LogOut, X } from 'lucide-react-native';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';

export default function ClockInModal() {
  const { therapistId, name } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // In a real app we'd fetch this to see current status, or pass it via params.
  // For simplicity we'll just check what the user wants to do.
  
  const handleClockIn = async (isClockOut: boolean) => {
    try {
      setLoading(true);
      const now = new Date();
      const timeString = now.toTimeString().substring(0, 5); // HH:MM
      const dateString = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

      const payload = {
        therapistId,
        branchId: user?.branchId,
        date: dateString,
        clockIn: isClockOut ? undefined : timeString,
        clockOut: isClockOut ? timeString : undefined,
        status: 'PRESENT',
      };

      await api.post('/attendance', payload);
      
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      Alert.alert('Success', `Successfully clocked ${isClockOut ? 'out' : 'in'} for ${name}`);
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to clock in/out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 pt-12">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-2xl font-bold text-gray-800">Attendance</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
          <X color="#4b5563" size={24} />
        </TouchableOpacity>
      </View>

      <View className="items-center mb-10 mt-10">
        <View className="bg-mint-accent/20 w-32 h-32 rounded-full items-center justify-center mb-6">
          <Clock color="#4BAE7D" size={64} />
        </View>
        <Text className="text-3xl font-bold text-gray-800 text-center">{name}</Text>
        <Text className="text-gray-500 mt-2 text-lg text-center">Record your attendance for today</Text>
      </View>

      <View className="space-y-4 gap-4 mt-auto mb-10">
        <TouchableOpacity 
          className={`bg-mint-primary py-5 rounded-2xl flex-row items-center justify-center shadow-sm ${loading ? 'opacity-70' : ''}`}
          onPress={() => handleClockIn(false)}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <>
              <LogIn color="#fff" size={24} />
              <Text className="text-white font-bold text-xl ml-3">Clock In</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className={`bg-salmon py-5 rounded-2xl flex-row items-center justify-center shadow-sm ${loading ? 'opacity-70' : ''}`}
          onPress={() => handleClockIn(true)}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <>
              <LogOut color="#fff" size={24} />
              <Text className="text-white font-bold text-xl ml-3">Clock Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
