import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { formatDuration, Service } from '../models/professional';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { catalogLabel } from '../utils/catalog';
import { formatPrice } from '../utils/money';
import { ruleLabel } from '../utils/pricing';
import { PhotoPager } from './photo-pager';
import { Text } from './text';

type Props = {
  service: Service;
  visible: boolean;
  // The service is already in the booking
  selected: boolean;
  // Without it the sheet only shows the service (who cannot book has no button)
  onToggle?: () => void;
  onClose: () => void;
};

// The screen of a service, like the site: a sheet over the page with the photos (swipe sideways), the duration, the
// price and the whole description, and a button to add it to the booking. Pull it down to close.
export function ServiceSheet({ service, visible, selected, onToggle, onClose }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const name = catalogLabel(service.name);
  const photos = service.photos ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {photos.length ? (
            <PhotoPager photos={photos} width={width} height={288} label={name} activeBar />
          ) : (
            <View style={styles.noPhoto}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Fechar')}
                onPress={onClose}
                hitSlop={12}
                style={styles.handle}
              />
            </View>
          )}

          <View style={styles.info}>
            <Text accessibilityRole="header" style={styles.name}>
              {name}
            </Text>
            <View style={styles.duration}>
              <MaterialIcons name="schedule" size={20} color={fixed.ink} />
              <Text>{formatDuration(service.durationMinutes)}</Text>
            </View>
            <Text style={[styles.price, { color: theme.primary }]}>
              {formatPrice(service.price)}
            </Text>
            {service.priceRules?.map((rule, n) => (
              <Text key={n} style={styles.rule}>
                {ruleLabel(rule)}: <Text style={styles.bold}>{formatPrice(rule.price)}</Text>
              </Text>
            ))}
            {service.description ? (
              <View style={styles.about}>
                <Text accessibilityRole="header" style={styles.aboutTitle}>
                  {t('Sobre o serviço')}
                </Text>
                <Text style={styles.description}>{service.description}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {onToggle ? (
          <View style={styles.bar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                selected ? t('Remover do agendamento') : t('Adicionar ao agendamento')
              }
              onPress={onToggle}
              style={[
                styles.add,
                { borderColor: theme.primary },
                { backgroundColor: selected ? fixed.white : theme.primary },
              ]}
            >
              <Text style={[styles.addText, { color: selected ? theme.primary : fixed.white }]}>
                {selected ? t('Remover do agendamento') : t('Adicionar ao agendamento')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: fixed.white },
  scroll: { paddingBottom: 24 },
  noPhoto: { height: 36, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 56, height: 5, borderRadius: 3, backgroundColor: fixed.border },
  info: { padding: 24, paddingBottom: 0, gap: 8 },
  name: { fontSize: 24, fontWeight: '700', color: fixed.ink },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '800' },
  rule: { color: fixed.gray, fontSize: 14 },
  bold: { fontWeight: '700', color: fixed.ink },
  about: { marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e8e8ee', gap: 10 },
  aboutTitle: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  description: { color: fixed.gray, lineHeight: 26 },
  bar: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, backgroundColor: fixed.white },
  add: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 17, fontWeight: '600' },
});
