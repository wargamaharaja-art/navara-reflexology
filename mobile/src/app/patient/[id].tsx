import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Phone, MapPin, User, CalendarClock, Activity } from 'lucide-react-native';
import api from '../../lib/api';

const fetchPatientDetails = async (id: string) => {
  const res = await api.get(`/patients/${id}`);
  return res.data.data;
};

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams();
  
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchPatientDetails(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-mint-light justify-center items-center">
        <ActivityIndicator size="large" color="#4BAE7D" />
      </View>
    );
  }

  if (error || !patient) {
    return (
      <View className="flex-1 bg-mint-light justify-center items-center p-6">
        <Text className="text-salmon font-bold text-lg mb-4">Patient not found</Text>
        <TouchableOpacity 
          className="bg-mint-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-mint-light">
      {/* Header Profile */}
      <View className="bg-mint-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
          >
            <ChevronLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Patient Profile</Text>
        </View>

        <View className="flex-row items-center">
          <View className="bg-white p-1 rounded-full mr-4">
            <View className="bg-mint-accent w-20 h-20 rounded-full items-center justify-center border-4 border-white">
              <User color="#4BAE7D" size={40} />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold mb-1">{patient.name}</Text>
            <View className="flex-row items-center mb-1">
              <Phone color="rgba(255,255,255,0.8)" size={14} />
              <Text className="text-white/90 text-sm ml-1">{patient.phone}</Text>
            </View>
            {patient.address && (
              <View className="flex-row items-start mt-1">
                <MapPin color="rgba(255,255,255,0.8)" size={14} style={{ marginTop: 2 }} />
                <Text className="text-white/80 text-xs ml-1 flex-1">{patient.address}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="px-6 pt-6 pb-20">
        <Text className="text-lg font-bold text-gray-800 mb-4 px-1">Medical Record & History</Text>
        
        {patient.visits && patient.visits.length > 0 ? (
          patient.visits.map((visit: any, index: number) => (
            <View key={visit.id} className="bg-white p-5 rounded-3xl mb-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center">
                  <View className="bg-mint-accent/30 p-2 rounded-xl mr-3">
                    <Activity color="#4BAE7D" size={20} />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-800">{visit.serviceName}</Text>
                    <Text className="text-xs text-mint-primary font-bold">{visit.serviceCategory}</Text>
                  </View>
                </View>
                
                <View className={`px-2 py-1 rounded-md ${visit.status === 'completed' ? 'bg-mint-primary/10' : 'bg-gray-100'}`}>
                  <Text className={`text-[10px] font-bold ${visit.status === 'completed' ? 'text-mint-primary' : 'text-gray-500'}`}>
                    {visit.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View className="border-t border-gray-100 pt-3 mt-1 space-y-2">
                <View className="flex-row items-center">
                  <CalendarClock color="#9ca3af" size={14} />
                  <Text className="text-gray-500 text-xs ml-2">
                    {visit.visitDate} • {visit.visitTime}
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <User color="#9ca3af" size={14} />
                  <Text className="text-gray-500 text-xs ml-2 flex-1">
                    Therapist: {visit.therapistName || '-'}
                  </Text>
                </View>
                {visit.bloodPressure && (
                  <View className="flex-row items-center mt-2">
                    <Activity color="#ef4444" size={14} />
                    <Text className="text-gray-500 text-xs ml-2 flex-1">
                      Tensi Darah: <Text className="font-bold text-red-500">{visit.bloodPressure}</Text>
                    </Text>
                  </View>
                )}
                {visit.notes && (
                  <View className="bg-amber-50 p-2 rounded-lg mt-2">
                    <Text className="text-amber-800 text-xs font-medium italic">"{visit.notes}"</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white p-8 rounded-3xl items-center justify-center border border-dashed border-gray-200">
            <Activity color="#d1d5db" size={40} />
            <Text className="text-gray-400 font-medium text-center mt-4">
              No visit history available for this patient.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
