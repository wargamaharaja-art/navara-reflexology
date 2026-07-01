import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { PlusCircle, User, BarChart2, Briefcase } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { BarChart, ProgressChart } from 'react-native-chart-kit';
import { useState, useCallback } from 'react';

const fetchDashboardChart = async () => {
  const res = await api.get('/dashboard/mobile-chart');
  return res.data.data;
};

export default function HomeDashboard() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardChart'],
    queryFn: fetchDashboardChart
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const screenWidth = Dimensions.get("window").width;

  // Prepare data for Bar Chart (Revenue over 7 days)
  const barChartData = {
    labels: data?.last7Days ? data.last7Days.map((d: any) => d.day) : ["M", "T", "W", "T", "F", "S", "S"],
    datasets: [
      {
        data: data?.last7Days ? data.last7Days.map((d: any) => d.revenue / 1000) : [0, 0, 0, 0, 0, 0, 0] // scaling down by 1k for display
      }
    ]
  };

  // Prepare data for Progress Chart (Income vs Expense Ratio)
  const incomeOutcomeData = {
    labels: ["Income", "Expense"],
    data: [
      data?.incomeOutcomeRatio ? data.incomeOutcomeRatio.incomePercent / 100 : 0,
      data?.incomeOutcomeRatio ? data.incomeOutcomeRatio.expensePercent / 100 : 0
    ],
    colors: ["#4BAE7D", "#FF7C74"]
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(75, 174, 125, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeDasharray: "", // solid background lines
      stroke: "rgba(0,0,0,0.05)"
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-mint-light"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4BAE7D']} />
      }
    >
      <View className="pt-14 pb-6 px-6">
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 text-sm font-medium">Hello,</Text>
            <Text className="text-gray-800 text-xl font-bold">{user?.name || 'Admin Navara'}</Text>
          </View>
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
            <User color="#4BAE7D" size={24} />
          </View>
        </View>
        
        {/* Main Card (Revenue) */}
        <View className="bg-mint-primary rounded-3xl p-6 shadow-lg shadow-mint-primary/40 relative overflow-hidden mb-6">
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
          
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white/80 font-medium">Total Revenue</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">TODAY</Text>
            </View>
          </View>
          
          <View>
            {isLoading ? (
               <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start' }} />
            ) : (
               <Text className="text-white text-4xl font-bold tracking-tight mb-1">
                 Rp {data?.todayRevenue ? data.todayRevenue.toLocaleString('id-ID') : '0'}
               </Text>
            )}
            <Text className="text-white/70 text-sm">Valid across all branches</Text>
          </View>
        </View>
        
        {/* Quick Actions (Floating Glass Cards) */}
        <Text className="text-lg font-bold text-gray-800 mb-4 px-1">Quick Actions</Text>
        <View className="flex-row justify-between mb-8">
          {['New Visit', 'Add Expense', 'Check Stock'].map((action, i) => {
            const icons = [<PlusCircle color="#4BAE7D" size={24} />, <Briefcase color="#FF7C74" size={24} />, <BarChart2 color="#4BAE7D" size={24} />];
            const bgColors = ['bg-mint-accent/30', 'bg-salmon/10', 'bg-mint-accent/30'];
            
            return (
              <TouchableOpacity 
                key={i} 
                className="bg-white p-4 rounded-3xl w-[31%] items-center shadow-sm"
                onPress={() => {
                  if (action === 'New Visit') router.push('/new-visit');
                  else if (action === 'Add Expense') router.push('/new-expense');
                }}
              >
                <View className={`${bgColors[i]} w-12 h-12 rounded-full items-center justify-center mb-3`}>
                  {icons[i]}
                </View>
                <Text className="text-center text-xs font-semibold text-gray-700">{action}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Real Analytics Chart */}
        <View className="bg-white rounded-3xl pt-6 pb-2 shadow-sm mb-6 overflow-hidden">
          <View className="flex-row justify-between items-center mb-4 px-6">
            <Text className="text-lg font-bold text-gray-800">Analytics (7 Days)</Text>
            <Text className="text-gray-400 text-xs font-medium">in Thousands (k)</Text>
          </View>
          
          {isLoading ? (
            <View className="h-48 justify-center items-center">
              <ActivityIndicator color="#4BAE7D" size="large" />
            </View>
          ) : (
            <BarChart
              data={barChartData}
              width={screenWidth - 24} // from react-native
              height={220}
              yAxisLabel="Rp "
              yAxisSuffix="k"
              chartConfig={chartConfig}
              style={{ paddingRight: 40 }}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
            />
          )}
        </View>

        {/* Progress Chart */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">Income vs Expense (This Month)</Text>
          
          {isLoading ? (
            <View className="h-32 justify-center items-center">
              <ActivityIndicator color="#4BAE7D" />
            </View>
          ) : (
            <View className="flex-row items-center">
              <View style={{ marginLeft: -30 }}>
                <ProgressChart
                  data={incomeOutcomeData}
                  width={screenWidth / 2}
                  height={120}
                  strokeWidth={12}
                  radius={28}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1, index = 0) => {
                      return index === 0 ? `rgba(75, 174, 125, ${opacity})` : `rgba(255, 124, 116, ${opacity})`;
                    },
                  }}
                  hideLegend={true}
                />
              </View>
              <View className="flex-1 justify-center">
                <View className="flex-row items-center mb-4">
                  <View className="w-3 h-3 rounded-full bg-mint-primary mr-2" />
                  <View>
                    <Text className="text-gray-500 text-xs font-medium">Income</Text>
                    <Text className="text-gray-800 font-bold">
                      Rp {data?.incomeOutcomeRatio?.incomeAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-salmon mr-2" />
                  <View>
                    <Text className="text-gray-500 text-xs font-medium">Expense</Text>
                    <Text className="text-gray-800 font-bold">
                      Rp {data?.incomeOutcomeRatio?.expenseAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
