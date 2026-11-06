import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';

// The tabs of the client (the bar at the bottom of the site). Agenda and Mensagens come with the next phase.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: fixed.brand,
        tabBarInactiveTintColor: fixed.gray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('Início'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('Explorar'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: t('Perfil'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
