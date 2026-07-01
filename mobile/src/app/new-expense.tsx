import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, Receipt } from 'lucide-react-native';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const CATEGORIES = [
  { id: 'Beban Operasional', name: 'Beban Operasional' },
  { id: 'HPP Barang', name: 'HPP Barang (Stok)' },
  { id: 'Beban Gaji', name: 'Beban Gaji' },
  { id: 'Lainnya', name: 'Lainnya' }
];

export default function NewExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data.data
  });

  const handleSubmit = async () => {
    if (!amount || !description || !category || !branchId) {
      Alert.alert('Incomplete Data', 'Please fill all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        type: 'EXPENSE',
        category,
        amount: parseInt(amount.replace(/[^0-9]/g, ''), 10),
        description,
        branchId,
        paymentMethod: 'CASH',
      };

      await api.post('/finance', payload);
      
      // Refresh finance list
      queryClient.invalidateQueries({ queryKey: ['financeAccounting'] });
      
      Alert.alert('Success', 'Expense recorded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to save expense';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Selector = ({ title, data, value, setValue, keyProp, labelProp }: any) => (
    <View className="mb-6">
      <Text className="text-gray-700 font-bold mb-3 px-2">{title}</Text>
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
        <Text className="text-xl font-bold text-gray-800 ml-3">Record Expense</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-gray-700 font-medium mb-2 px-2">Amount (Rp)</Text>
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-4 shadow-sm text-gray-800 text-lg font-bold"
          placeholder="e.g. 50000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        
        <Text className="text-gray-700 font-medium mb-2 px-2">Description</Text>
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-8 shadow-sm text-gray-800"
          placeholder="e.g. Pembelian galon air"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
        />

        <Selector 
          title="Select Branch" 
          data={branches} 
          value={branchId} 
          setValue={setBranchId} 
          keyProp="id" 
          labelProp="name" 
        />

        <Selector 
          title="Expense Category" 
          data={CATEGORIES} 
          value={category} 
          setValue={setCategory} 
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
              <Receipt color="#fff" size={20} className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Save Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
