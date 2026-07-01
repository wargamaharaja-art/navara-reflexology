import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCircle, HandCoins, CheckCircle, Clock } from 'lucide-react-native';
import api from '../../lib/api';
import { useState, useCallback } from 'react';

const fetchStaff = async () => {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const res = await api.get(`/therapist-reports?month=${currentMonth}`);
  return res.data.data;
};

const fetchAttendance = async () => {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const res = await api.get(`/attendance?date=${today}`);
  return res.data.data;
};

export default function StaffScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: staffData, isLoading: loadingStaff, error: errorStaff, refetch: refetchStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
  });

  const { data: attendanceData, isLoading: loadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: fetchAttendance,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStaff();
    await refetchAttendance();
    setRefreshing(false);
  }, [refetchStaff, refetchAttendance]);

  const getAttendanceStatus = (therapistId: string) => {
    if (!attendanceData) return null;
    return attendanceData.find((a: any) => a.therapistId === therapistId);
  };

  const renderStaffCard = ({ item }: { item: any }) => {
    const attendance = getAttendanceStatus(item.therapistId);
    const hasClockedIn = !!attendance?.clockIn;
    const hasClockedOut = !!attendance?.clockOut;

    return (
      <View className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100 flex-row items-center">
        <View className="bg-mint-accent/30 p-4 rounded-2xl mr-4">
          <UserCircle color="#4BAE7D" size={28} />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-800 text-lg">{item.therapistName}</Text>
          <Text className="text-gray-500 text-sm mb-2">{item.totalTreatments} Treatments (This Month)</Text>
          
          <View className="flex-row items-center mb-2">
            <HandCoins color="#f59e0b" size={16} />
            <Text className="ml-1 text-sm font-bold text-amber-500">
              Rp {item.commissions.toLocaleString('id-ID')}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              {hasClockedIn ? (
                <CheckCircle color="#4BAE7D" size={14} />
              ) : (
                <Clock color="#9ca3af" size={14} />
              )}
              <Text className={`ml-1 text-xs font-bold ${hasClockedIn ? 'text-mint-primary' : 'text-gray-400'}`}>
                {hasClockedIn ? (hasClockedOut ? 'CLOCKED OUT' : 'CLOCKED IN') : 'NOT PRESENT'}
              </Text>
            </View>
            
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-full ${hasClockedIn && !hasClockedOut ? 'bg-salmon' : 'bg-mint-primary'}`}
              onPress={() => router.push({
                pathname: '/clock-in',
                params: { therapistId: item.therapistId, name: item.therapistName }
              })}
            >
              <Text className="text-white text-xs font-bold">
                {hasClockedIn && !hasClockedOut ? 'Clock Out' : 'Clock In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-mint-light">
      <View className="bg-mint-primary pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
        <Text className="text-white text-3xl font-bold">Staff Management</Text>
        <Text className="text-white/80 mt-1 font-medium">Therapists commissions & attendance</Text>
      </View>

      {loadingStaff || loadingAttendance ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4BAE7D" />
        </View>
      ) : errorStaff ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-salmon font-bold text-lg">Failed to load staff.</Text>
          <Text className="text-gray-500">{(errorStaff as any)?.message}</Text>
        </View>
      ) : (
        <FlatList
          data={staffData}
          keyExtractor={(item) => item.therapistId}
          renderItem={renderStaffCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4BAE7D']} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10 font-medium">No therapists found.</Text>
          }
        />
      )}
    </View>
  );
}
