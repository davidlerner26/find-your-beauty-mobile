import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { useMessages } from '../../contexts/messages';
import { useNotifications } from '../../contexts/notifications';
import { TabBar } from '../../components/tab-bar';
import { t } from '../../i18n';
import { fixed } from '../../theme/colors';
import { PATHS } from '../../utils/paths';

type IconName = keyof typeof MaterialIcons.glyphMap;
// The icon of a tab: a function that draws it with the color and the size the bar gives
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: string | unknown; size: number }) {
    return <MaterialIcons name={name} size={size} color={color as string} />;
  };

// The tabs of the client (the bar at the bottom of the site)
export default function TabsLayout() {
  const auth = useAuth();
  const { unreadTotal: messages } = useMessages();
  const { unreadTotal: notifications } = useNotifications();
  const news = auth.user ? messages + notifications : 0;

  // Professionals have their own area (and an unfinished sign up goes back to its second step)
  if (auth.signupIncomplete) return <Redirect href={PATHS.proSignup as never} />;
  if (auth.role === 'professional') return <Redirect href={PATHS.proHome as never} />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: fixed.brand,
        tabBarInactiveTintColor: fixed.gray,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('Início'), tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explore" options={{ title: t('Explorar'), tabBarIcon: icon('explore') }} />
      <Tabs.Screen
        name="agenda"
        options={{ title: t('Agenda'), tabBarIcon: icon('calendar-today') }}
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
