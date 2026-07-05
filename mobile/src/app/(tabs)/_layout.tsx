import { Tabs } from 'expo-router';
import { Home, Calendar, Wallet, User, Users, Contact } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#4BAE7D',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { 
        height: 65, 
        paddingBottom: 15, 
        paddingTop: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="visits" 
        options={{ 
          title: 'Visits',
          headerShown: false,
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="finance" 
        options={{ 
          title: 'Finance',
          headerShown: false,
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="crm" 
        options={{ 
          title: 'CRM',
          headerShown: false,
          tabBarIcon: ({ color }) => <Contact color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <User color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="staff" 
        options={{ 
          title: 'Staff',
          headerShown: false,
          tabBarIcon: ({ color }) => <Users color={color} size={24} />
        }} 
      />
    </Tabs>
  );
}
