import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

// Note: For a real app, use a proper dropdown library like react-native-dropdown-picker
// To keep things simple in Sprint 4 without adding new libraries, we'll build a simple horizontal scroller selector

export default function NewVisit() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data.data
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data.data
  });

  const { data: therapists } = useQuery({
    queryKey: ['therapists'],
    queryFn: async () => (await api.get('/therapists')).data.data
  });

  const handleSubmit = async () => {
    if (!name || !phone || !serviceId || !branchId) {
      Alert.alert('Incomplete Data', 'Please fill in patient details, service, and branch.');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        name,
        phone,
        serviceId,
        branchId,
        therapistId: therapistId || undefined,
        visitDate: new Date().toISOString().split('T')[0], // Today
        visitTime: new Date().toTimeString().split(' ')[0].substring(0, 5), // Current time HH:MM
        status: 'completed'
      };

      await api.post('/patient-visits', payload);
      
      // Refresh visits list
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      
      Alert.alert('Success', 'Visit recorded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to save visit';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Selector = ({ title, data, value, setValue, keyProp, labelProp }: any) => (
    <View className="mb-6">
      <Text className="text-gray-700 font-bold mb-3">{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data?.map((item: any) => (
          <TouchableOpacity 
            key={item[keyProp]}
            onPress={() => setValue(item[keyProp])}
            className={`mr-3 px-5 py-3 rounded-full border ${value === item[keyProp] ? 'bg-mint-primary border-mint-primary' : 'bg-white border-transparent shadow-sm'}`}
          >
            <Text className={value === item[keyProp] ? 'text-white font-bold' : 'text-gray-600 font-medium'}>
              {item[labelProp]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-mint-light">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 flex-row items-center border-b border-gray-100 shadow-sm rounded-b-3xl z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <ChevronLeft color="#4BAE7D" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-3">New Patient Visit</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-lg font-bold text-mint-primary mb-4">Patient Information</Text>
        
        <Text className="text-gray-700 font-medium mb-2 px-2">Full Name</Text>
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-4 shadow-sm text-gray-800"
          placeholder="e.g. John Doe"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />
        
        <Text className="text-gray-700 font-medium mb-2 px-2">Phone Number</Text>
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-8 shadow-sm text-gray-800"
          placeholder="e.g. 08123456789"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text className="text-lg font-bold text-mint-primary mb-4">Visit Details</Text>
        
        <Selector 
          title="Select Branch" 
          data={branches} 
          value={branchId} 
          setValue={setBranchId} 
          keyProp="id" 
          labelProp="name" 
        />

        <Selector 
          title="Select Service" 
          data={services} 
          value={serviceId} 
          setValue={setServiceId} 
          keyProp="id" 
          labelProp="name" 
        />

        <Selector 
          title="Assign Therapist (Optional)" 
          data={therapists?.filter((t: any) => !branchId || t.branchId === branchId)} 
          value={therapistId} 
          setValue={setTherapistId} 
          keyProp="id" 
          labelProp="name" 
        />

        <TouchableOpacity 
          className={`bg-salmon p-4 rounded-full flex-row items-center justify-center mt-6 mb-12 shadow-lg shadow-salmon/40 ${submitting ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Save Visit</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
