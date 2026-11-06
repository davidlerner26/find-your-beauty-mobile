import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { environment } from '../config/environment';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { APP_LANGUAGE } from '../utils/locale';
import { legalUrl } from '../utils/legal-url';
import { BackButton } from './back-button';
import { Button } from './button';
import { Screen } from './screen';

// The terms and the privacy policy are the pages of the site, opened inside the app
export function LegalScreen({ page, title }: { page: 'privacidade' | 'termos'; title: string }) {
  const open = useCallback(
    () => WebBrowser.openBrowserAsync(legalUrl(environment.siteUrl, page, APP_LANGUAGE)),
    [page],
  );

  useEffect(() => {
    void open();
  }, [open]);

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Button label={t('Abrir no navegador')} onPress={() => void open()} />
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { fontSize: 28, fontWeight: '700', color: fixed.ink } });
