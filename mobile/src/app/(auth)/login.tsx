import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email/PIN and password');
      return;
    }

    try {
      setLoading(true);
      // Calls the real Next.js backend API
      const res = await api.post('/auth/login', { 
        username: email, 
        password 
      });

      if (res.data?.token && res.data?.user) {
        await login(res.data.token, res.data.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Login failed. Check your credentials and connection.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-mint-primary justify-center items-center px-8 relative overflow-hidden">
      {/* Decorative background circles */}
      <View className="absolute -top-32 -left-20 w-80 h-80 bg-white/10 rounded-full" />
      <View className="absolute bottom-10 -right-20 w-64 h-64 bg-mint-dark/20 rounded-full" />

      <View className="mb-12 items-center z-10 w-full">
        <Image 
          source={require('../../../assets/images/icon.png')} 
          style={{ width: 280, height: 120, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className="text-white/80 text-center px-4">Clinic Operations</Text>
      </View>
      
      <View className="w-full z-10">
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-5 shadow-sm text-gray-800 text-base font-medium"
          placeholder="Login ID"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        
        <TextInput 
          className="bg-white px-6 py-4 rounded-full mb-10 shadow-sm text-gray-800 text-base font-medium"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity 
          className={`bg-salmon py-4 rounded-full items-center shadow-lg shadow-salmon/40 ${loading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text className="text-white font-semibold text-lg tracking-wide">Log in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
