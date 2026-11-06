import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/auth';
import { useMessages } from '../contexts/messages';
import { useNotifications } from '../contexts/notifications';
import { useProfessionals } from '../contexts/professionals';
import { t } from '../i18n';
import { Notification } from '../models/message';
import { loadConversationTexts } from '../services/messages';
import { markNotificationAsRead } from '../services/notifications';
import { fixed } from '../theme/colors';
import { formatRelative } from '../utils/format-date';
import { filterConversations, Row } from '../utils/inbox-search';
import { focusPosition } from '../utils/labels';
import { log } from '../utils/log';
import { PATHS } from '../utils/paths';
import { Spinner } from './spinner';

const ICONS = { calendar: 'event', payment: 'payments', offer: 'local-offer' } as const;

// Messages and notifications of the signed in user. The professional area shows the clients instead of the
// professionals, and its screens live under /pro.
export function Inbox({ pro = false }: { pro?: boolean }) {
  const router = useRouter();
  const auth = useAuth();
  const { conversations } = useMessages();
  const notifications = useNotifications();
  const professionals = useProfessionals();
  const [tab, setTab] = useState<'mensagens' | 'notificacoes'>('mensagens');
  const [search, setSearch] = useState('');
  const [texts, setTexts] = useState<Record<string, string[]>>({});

  const rows = useMemo(
    () =>
      conversations.flatMap(
        (
          conversation,
        ): (Row & {
          image: string | null;
          position?: { x: number; y: number };
          href: string;
        })[] => {
          if (pro) {
            return [
              {
                ...conversation,
                title: conversation.clientName,
                image: conversation.clientImage ?? null,
                href: `${PATHS.proMessages}/${conversation.id}`,
              },
            ];
          }
          const artist = professionals.byId(conversation.professionalId);
          return artist
            ? [
                {
                  ...conversation,
                  title: artist.name,
                  image: artist.image,
                  position: artist.imagePosition,
                  href: `/mensagens/${artist.id}`,
                },
              ]
            : [];
        },
      ),
    [conversations, professionals, pro],
  );
  const shown = filterConversations(rows, search, texts) as typeof rows;

  const onSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      loadConversationTexts(conversations.map((conversation) => conversation.id))
        .then(setTexts)
        .catch((error) => log.error('Failed to load the messages to search', error));
    }
  };

  // Every notification is about a booking: the professional goes to the agenda (new requests are there) and the
  // client to their bookings
  const open = (notification: Notification) => {
    if (notification.unread && auth.user) {
      markNotificationAsRead(auth.user.uid, notification.id).catch((error) =>
        log.error('Failed to mark as read', error),
      );
    }
    router.push((pro ? PATHS.proHome : PATHS.agenda) as never);
  };

  const unreadNotifications = notifications.list.filter((n) => n.unread);
  const earlier = notifications.list.filter((n) => !n.unread);

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('Mensagens')}
      </Text>
      <View style={styles.tabs}>
        {(['mensagens', 'notificacoes'] as const).map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === name }}
            accessibilityLabel={name === 'mensagens' ? t('Mensagens') : t('Notificações')}
            onPress={() => setTab(name)}
            style={[styles.tab, tab === name && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === name && { color: fixed.white }]}>
              {name === 'mensagens' ? t('Mensagens') : t('Notificações')}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'mensagens' ? (
        <>
          <TextInput
            accessibilityLabel={
              pro ? t('Buscar mensagens ou cliente') : t('Buscar mensagens ou profissional')
            }
            placeholder={
              pro ? t('Buscar mensagens ou cliente') : t('Buscar mensagens ou profissional')
            }
            placeholderTextColor={fixed.gray}
            value={search}
            onChangeText={onSearch}
            style={styles.search}
          />
          <FlatList
            data={shown}
            keyExtractor={(row) => row.id}
            ListEmptyComponent={
              <Text style={styles.muted}>
                {search.trim()
                  ? t('Nenhuma conversa encontrada.')
                  : t('Você ainda não tem conversas.')}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => router.push(item.href as never)}
                style={styles.row}
              >
                {item.image ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    source={{ uri: item.image }}
                    contentFit="cover"
                    contentPosition={focusPosition(item.position)}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.letter}>{item.title[0]}</Text>
                  </View>
                )}
                <View style={styles.flex}>
                  <View style={styles.between}>
                    <Text style={styles.name}>{item.title}</Text>
                    <Text style={styles.muted}>{formatRelative(item.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.between}>
                    <Text numberOfLines={1} style={[styles.muted, styles.flex]}>
                      {item.lastMessage}
                    </Text>
                    {item.unread ? <Text style={styles.badge}>{item.unread}</Text> : null}
                  </View>
                </View>
              </Pressable>
            )}
          />
        </>
      ) : notifications.loading ? (
        <Spinner />
      ) : (
        <FlatList
          data={[
            ...(unreadNotifications.length ? [{ header: t('Novas') }] : []),
            ...unreadNotifications,
            ...(earlier.length ? [{ header: t('Anteriores') }] : []),
            ...earlier,
          ]}
          keyExtractor={(item, n) => ('header' in item ? `h${n}` : item.id)}
          ListEmptyComponent={<Text style={styles.muted}>{t('Você não tem notificações.')}</Text>}
          renderItem={({ item }) =>
            'header' in item ? (
              <Text accessibilityRole="header" style={styles.heading}>
                {item.header}
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.text.map((part) => part.text).join('')}
                onPress={() => open(item)}
                style={styles.row}
              >
                <View style={styles.icon}>
                  <MaterialIcons name={ICONS[item.icon] ?? 'event'} size={22} color={fixed.brand} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.body}>
                    {item.text.map((part, n) => (
                      <Text key={n} style={part.bold ? styles.bold : undefined}>
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                  <Text style={styles.muted}>{formatRelative(item.createdAt)}</Text>
                </View>
                {item.unread ? <View style={styles.dot} /> : null}
              </Pressable>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: fixed.ink },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fixed.border,
  },
  tabOn: { backgroundColor: fixed.brand, borderColor: fixed.brand },
  tabText: { color: fixed.ink, fontWeight: '600' },
  search: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: fixed.surface,
    fontSize: 16,
    color: fixed.ink,
  },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontWeight: '700', color: fixed.brand, fontSize: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: fixed.ink },
  muted: { color: fixed.gray },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: fixed.accent,
    color: fixed.white,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  heading: { fontSize: 16, fontWeight: '700', color: fixed.ink, marginTop: 8 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { color: fixed.ink },
  bold: { fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: fixed.accent },
});
