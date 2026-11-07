import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useBookings } from '../../../contexts/bookings';
import { useMessages } from '../../../contexts/messages';
import { useNotifications } from '../../../contexts/notifications';
import { TabBar } from '../../../components/tab-bar';
import { t } from '../../../i18n';
import { fixed } from '../../../theme/colors';

type IconName = keyof typeof MaterialIcons.glyphMap;

// The icon of a tab: a function that draws it with the color and the size the bar gives
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: string | unknown; size: number }) {
    return <MaterialIcons name={name} size={size} color={color as string} />;
  };

// The tabs of the professional area: agenda, messages and profile
export default function ProTabsLayout() {
  const { unreadTotal: messages } = useMessages();
  const { unreadTotal: notifications } = useNotifications();
  const { received } = useBookings();
  const news = messages + notifications;
  const waiting = received.filter((booking) => booking.status === 'pending').length;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: fixed.brand,
        tabBarInactiveTintColor: fixed.gray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('Agenda'),
          tabBarIcon: icon('calendar-today'),
          tabBarBadge: waiting > 0 ? waiting : undefined,
        }}
      />
      <Tabs.Screen
        name="mensagens"
        options={{
          title: t('Mensagens'),
          tabBarIcon: icon('chat-bubble'),
          tabBarBadge: news > 0 ? news : undefined,
        }}
      />
      <Tabs.Screen name="perfil" options={{ title: t('Perfil'), tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
