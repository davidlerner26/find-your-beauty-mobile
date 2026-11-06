import { Redirect } from 'expo-router';
import { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { guardStateOf, useAuth } from '../contexts/auth';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { Guard as GuardKind, guardRedirect } from '../utils/guards';

// Wraps a screen with the rule of a route guard of the site (see utils/guards.ts). Waits until Firebase says
// whether there is a session, then shows the screen or sends the visitor somewhere else.
export function Guard({
  kind,
  proPath,
  children,
}: {
  kind: GuardKind;
  proPath?: string;
  children: ReactNode;
}) {
  const auth = useAuth();
  if (!auth.ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator accessibilityLabel={t('Carregando')} color={fixed.brand} />
      </View>
    );
  }

  const redirect = guardRedirect(kind, guardStateOf(auth), { proPath });
  // The paths are PATHS values, which expo-router's typed routes do not know as literals
  return redirect ? <Redirect href={redirect as never} /> : <>{children}</>;
}
