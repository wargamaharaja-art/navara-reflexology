import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Phone, User, ChevronRight } from 'lucide-react-native';
import api from '../../lib/api';
import { useState, useCallback } from 'react';

const fetchPatients = async () => {
  const res = await api.get('/patients');
  return res.data.data;
};

export default function CRMScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: patients, isLoading, error, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredPatients = patients?.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone.includes(searchQuery)
  ) || [];

  const renderPatientCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100 flex-row items-center"
      onPress={() => router.push(`/patient/${item.id}`)}
    >
      <View className="bg-mint-accent/30 w-14 h-14 rounded-full items-center justify-center mr-4">
        <Text className="text-mint-dark font-bold text-xl">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <Phone color="#9ca3af" size={14} />
          <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
        </View>
      </View>
      <View className="bg-gray-50 p-2 rounded-full">
        <ChevronRight color="#9ca3af" size={20} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-mint-light">
      <View className="bg-mint-primary pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
        <Text className="text-white text-3xl font-bold mb-4">Patient CRM</Text>
        
        <View className="bg-white/20 flex-row items-center px-4 py-3 rounded-2xl">
          <Search color="#ffffff" size={20} />
          <TextInput 
            className="flex-1 text-white ml-2 font-medium"
            placeholder="Search by name or phone..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4BAE7D" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-salmon font-bold text-lg">Failed to load patients.</Text>
          <Text className="text-gray-500">{(error as any)?.message}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4BAE7D']} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10 font-medium">No patients found.</Text>
          }
        />
      )}
    </View>
  );
}
