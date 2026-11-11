import { Share, StyleSheet, View } from 'react-native';
import { t } from '../i18n';
import { radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { log } from '../utils/log';
import { Button } from './button';
import { Text } from './text';

// The invite link that was just made, to send by hand. It is shown once: the server keeps only the hash of its token.
// "Compartilhar" opens the share sheet of the phone (WhatsApp, Instagram...).
export function InviteLinkBox({
  url,
  copied,
  name,
}: {
  url: string;
  copied: boolean;
  // Whose link it is, when the screen lists many
  name?: string;
}) {
  const theme = useTheme();
  const message = name
    ? copied
      ? t('Link de {{name}} copiado. Cole na conversa para enviar.', { name })
      : t('Link de {{name}}. Copie e envie.', { name })
    : copied
      ? t('Link copiado. Cole na conversa para enviar.')
      : t('Copie o link e envie.');

  const share = () =>
    Share.share({ message: url }).catch((error) => log.warn('Failed to share the link', error));

  return (
    <View style={[styles.box, { backgroundColor: theme.primaryLight }]}>
      <Text accessibilityRole="alert" style={[styles.message, { color: theme.primary }]}>
        {message}
      </Text>
      <Text selectable style={{ color: theme.text }}>
        {url}
      </Text>
      <Button variant="light" label={t('Compartilhar link')} onPress={() => void share()} />
      <Text style={{ color: theme.muted }}>
        {t(
          'Este link aparece só agora. Se precisar de outro, gere um novo: o anterior deixa de funcionar.',
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 12, padding: 16, borderRadius: radius.card },
  message: { fontWeight: '700' },
});
