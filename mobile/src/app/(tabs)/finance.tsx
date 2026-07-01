import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PlusCircle, FileText } from 'lucide-react-native';
import api from '../../lib/api';
import { useState, useCallback } from 'react';

const fetchFinance = async () => {
  const res = await api.get('/finance/accounting');
  return res.data.data;
};

export default function FinanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['financeAccounting'],
    queryFn: fetchFinance,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderJournalCard = ({ item }: { item: any }) => (
    <View className="bg-white p-5 rounded-3xl mb-4 shadow-sm flex-row items-center">
      <View className="bg-mint-accent/30 p-3 rounded-2xl mr-4 justify-center items-center">
         <FileText color="#4BAE7D" size={24} />
      </View>
      <View className="flex-1 justify-center">
        <Text className="font-bold text-gray-800">{item.description}</Text>
        <Text className="text-gray-500 text-xs mt-1 font-medium">{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View className="justify-center items-end">
         <Text className="font-bold text-mint-dark">
           {item.lines && item.lines.length > 0 ? `Rp ${item.lines[0].debit.toLocaleString('id-ID')}` : '-'}
         </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-mint-light">
      <View className="bg-mint-primary pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
        <Text className="text-white text-3xl font-bold">Finance</Text>
        <Text className="text-white/80 mt-1 font-medium">Accounting & Journals</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4BAE7D" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-salmon font-bold text-lg">Failed to load finance data.</Text>
        </View>
      ) : (
        <FlatList
          data={data?.journals || []}
          keyExtractor={(item) => item.id}
          renderItem={renderJournalCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4BAE7D']} />
          }
          ListHeaderComponent={
            <View className="mb-6">
              <View className="flex-row justify-between mb-6">
                <View className="bg-white p-5 rounded-3xl w-[48%] shadow-sm">
                  <View className="bg-mint-accent/30 p-2 rounded-full w-12 h-12 items-center justify-center mb-3">
                    <TrendingUp color="#4BAE7D" size={24} />
                  </View>
                  <Text className="text-gray-500 text-xs font-medium">Net Income</Text>
                  <Text className="text-gray-800 font-bold text-lg mt-1">
                    Rp {data?.metrics?.netIncome?.toLocaleString('id-ID') || 0}
                  </Text>
                </View>
                
                <View className="bg-white p-5 rounded-3xl w-[48%] shadow-sm">
                  <View className="bg-mint-accent/30 p-2 rounded-full w-12 h-12 items-center justify-center mb-3">
                    <TrendingUp color="#4BAE7D" size={24} />
                  </View>
                  <Text className="text-gray-500 text-xs font-medium">Total Revenue</Text>
                  <Text className="text-gray-800 font-bold text-lg mt-1">
                    Rp {data?.metrics?.totalRevenue?.toLocaleString('id-ID') || 0}
                  </Text>
                </View>
              </View>
              
              <Text className="font-bold text-xl text-gray-800 mb-2">Recent Journals</Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10 font-medium">No recent transactions.</Text>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-mint-primary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-mint-primary/50"
        onPress={() => router.push('/new-expense')}
      >
        <PlusCircle color="#FFFFFF" size={32} />
      </TouchableOpacity>
    </View>
  );
}
