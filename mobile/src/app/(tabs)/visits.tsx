import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, PlusCircle, CheckCircle, Clock } from 'lucide-react-native';
import api from '../../lib/api';
import { useState, useCallback } from 'react';

const fetchVisits = async () => {
  const res = await api.get('/patient-visits');
  return res.data.data;
};

export default function VisitsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: visits, isLoading, error, refetch } = useQuery({
    queryKey: ['visits'],
    queryFn: fetchVisits,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderVisitCard = ({ item }: { item: any }) => (
    <View className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100 flex-row items-center">
      <View className="bg-mint-accent/30 p-4 rounded-2xl mr-4">
        <CalendarClock color="#4BAE7D" size={28} />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-gray-800 text-lg">{item.patientId}</Text>
        <Text className="text-gray-500 text-sm">{item.serviceId} • {item.visitDate}</Text>
        
        <View className="flex-row items-center mt-2">
          {item.status === 'completed' ? (
             <CheckCircle color="#4BAE7D" size={14} />
          ) : (
             <Clock color="#f59e0b" size={14} />
          )}
          <Text className={`ml-1 text-xs font-bold ${item.status === 'completed' ? 'text-mint-primary' : 'text-amber-500'}`}>
            {item.status?.toUpperCase() || 'SCHEDULED'}
          </Text>
          <Text className="text-gray-400 text-xs ml-3 font-medium">• {item.visitTime}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-mint-light">
      <View className="bg-mint-primary pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
        <Text className="text-white text-3xl font-bold">Patient Visits</Text>
        <Text className="text-white/80 mt-1 font-medium">Manage today's appointments</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4BAE7D" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-salmon font-bold text-lg">Failed to load visits.</Text>
          <Text className="text-gray-500">{(error as any)?.message}</Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          renderItem={renderVisitCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4BAE7D']} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10 font-medium">No visits found.</Text>
          }
        />
      )}

      <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-mint-primary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-mint-primary/50"
        onPress={() => router.push('/new-visit')}
      >
        <PlusCircle color="#FFFFFF" size={32} />
      </TouchableOpacity>
    </View>
  );
}
