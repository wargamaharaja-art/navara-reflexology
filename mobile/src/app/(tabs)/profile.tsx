import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LogOut, User, Building, Settings } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-mint-light">
      <View className="bg-mint-primary pt-20 pb-10 px-6 rounded-b-[40px] shadow-sm items-center relative overflow-hidden">
        <View className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute -right-10 -bottom-10 w-32 h-32 bg-mint-dark/20 rounded-full" />
        
        <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
          <User color="#FFFFFF" size={48} />
        </View>
        <Text className="text-white text-2xl font-bold">{user?.name || 'User Name'}</Text>
        <View className="bg-white/20 px-4 py-1.5 rounded-full mt-3">
           <Text className="text-white font-bold text-xs">{user?.role || 'STAFF'}</Text>
        </View>
      </View>

      <View className="p-6">
        <Text className="text-lg font-bold text-gray-800 mb-4 px-1">Settings</Text>
        
        <TouchableOpacity className="bg-white p-5 rounded-3xl flex-row items-center mb-4 shadow-sm">
          <View className="bg-mint-accent/30 p-3 rounded-full mr-4">
            <Building color="#4BAE7D" size={24} />
          </View>
          <Text className="flex-1 font-semibold text-gray-700">Switch Branch</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-white p-5 rounded-3xl flex-row items-center mb-6 shadow-sm">
          <View className="bg-gray-100 p-3 rounded-full mr-4">
            <Settings color="#6b7280" size={24} />
          </View>
          <Text className="flex-1 font-semibold text-gray-700">App Preferences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-white p-5 rounded-3xl flex-row items-center shadow-sm"
          onPress={handleLogout}
        >
          <View className="bg-salmon/10 p-3 rounded-full mr-4">
            <LogOut color="#FF7C74" size={24} />
          </View>
          <Text className="flex-1 font-bold text-salmon">Log Out</Text>
        </TouchableOpacity>
      </View>
      
      <View className="mt-auto pb-8 items-center">
        <Text className="text-gray-400 text-xs font-medium">Navara Reflexology Mobile v1.0.0</Text>
      </View>
    </View>
  );
}
