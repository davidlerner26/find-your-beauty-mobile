import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useAuthActions } from '../contexts/auth';
import { t } from '../i18n';
import { useTheme } from '../theme/theme';

// Placeholder of the home until phase 2: shows that Firebase, the session and the role work
export default function Home() {
  const theme = useTheme();
  const auth = useAuth();
  const { signOut } = useAuthActions();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text
          accessibilityRole="header"
          style={{ color: theme.text, fontSize: 28, fontWeight: '700' }}
        >
          {t('Maquiagem e cabelo perto de você')}
        </Text>
        <Text style={{ color: theme.muted }}>
          {auth.ready
            ? auth.user
              ? `${auth.user.email} (${auth.role ?? '-'})`
              : '-'
            : t('Carregando')}
        </Text>
        {auth.user ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={{ backgroundColor: theme.primary, padding: 14, borderRadius: 12 }}
          >
            <Text style={{ color: theme.onPrimary, textAlign: 'center' }}>{t('Sair')}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
