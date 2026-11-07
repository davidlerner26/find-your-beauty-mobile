import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './text';
import { useAuth } from '../contexts/auth';
import { useMessages } from '../contexts/messages';
import { useNotifications } from '../contexts/notifications';
import { useProfessionals } from '../contexts/professionals';
import { t } from '../i18n';
import { Notification } from '../models/message';
import { loadConversationTexts } from '../services/messages';
import { markNotificationAsRead } from '../services/notifications';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { formatRelative } from '../utils/format-date';
import { filterConversations, Row } from '../utils/inbox-search';
import { focusPosition } from '../utils/labels';
import { log } from '../utils/log';
import { PATHS } from '../utils/paths';
import { Spinner } from './spinner';
import { Visitor } from './visitor';

const ICONS = { calendar: 'calendar-today', payment: 'attach-money', offer: 'sell' } as const;

// Messages and notifications of the signed in user. The professional area shows the clients instead of the
// professionals, and its screens live under /pro.
export function Inbox({ pro = false }: { pro?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
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
      <View style={[styles.strip, { borderBottomColor: theme.line }]}>
        {(['mensagens', 'notificacoes'] as const).map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === name }}
            accessibilityLabel={name === 'mensagens' ? t('Mensagens') : t('Notificações')}
            onPress={() => setTab(name)}
            style={styles.stripTab}
          >
            <Text
              style={[styles.stripText, tab === name && [styles.stripOn, { color: theme.primary }]]}
            >
              {name === 'mensagens' ? t('Mensagens') : t('Notificações')}
            </Text>
            {tab === name ? (
              <View style={[styles.stripDot, { backgroundColor: theme.primary }]} />
            ) : null}
          </Pressable>
        ))}
      </View>

      {!auth.user ? (
        <View style={styles.visitorBox}>
          <Visitor
            message={
              tab === 'mensagens'
                ? t('Entre na sua conta para ver suas mensagens.')
                : t('Entre na sua conta para ver suas notificações.')
            }
          />
        </View>
      ) : null}

      {!auth.user ? null : tab === 'mensagens' ? (
        <>
          <View style={styles.search}>
            <MaterialIcons name="search" size={24} color={fixed.brand} />
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
              style={styles.searchField}
            />
          </View>
          <FlatList
            contentContainerStyle={styles.list}
            data={shown}
            keyExtractor={(row) => row.id}
            ListEmptyComponent={
              <Text style={[styles.muted, styles.empty]}>
                {search.trim()
                  ? t('Nenhuma conversa encontrada.')
                  : pro
                    ? t('Você ainda não recebeu mensagens.')
                    : t(
                        'Você ainda não tem conversas. Abra o perfil de um profissional para começar uma.',
                      )}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => router.push(item.href as never)}
                style={[styles.row, styles.divided, { borderBottomColor: theme.line }]}
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
                  <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.letter, { color: theme.primary }]}>{item.title[0]}</Text>
                  </View>
                )}
                <View style={styles.flex}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text numberOfLines={1} style={styles.muted}>
                    {item.lastMessage}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.small}>{formatRelative(item.lastMessageAt)}</Text>
                  {item.unread ? <Text style={styles.badge}>{item.unread}</Text> : null}
                </View>
              </Pressable>
            )}
          />
        </>
      ) : notifications.loading ? (
        <Spinner />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
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
                style={[styles.row, styles.divided, { borderBottomColor: theme.line }]}
              >
                <View style={[styles.icon, { backgroundColor: theme.primaryLight }]}>
                  <MaterialIcons
                    name={ICONS[item.icon] ?? 'calendar-today'}
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.body, styles.flex]}>
                  {item.text.map((part, n) => (
                    <Text key={n} style={part.bold ? styles.bold : undefined}>
                      {part.text}
                    </Text>
                  ))}
                </Text>
                <View style={styles.meta}>
                  <Text style={styles.small}>{formatRelative(item.createdAt)}</Text>
                  {item.unread ? <View style={styles.dot} /> : null}
                </View>
              </Pressable>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  visitorBox: { paddingHorizontal: 24, paddingTop: 24 },
  list: { paddingHorizontal: 24, paddingBottom: 48 },
  strip: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: fixed.borderSoft },
  stripTab: { flex: 1, alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  stripText: { color: fixed.gray, fontSize: 16 },
  stripOn: { fontWeight: '600' },
  stripDot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3 },
  flex: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: fixed.surface,
  },
  searchField: { flex: 1, fontSize: 16, color: fixed.ink },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 16, alignItems: 'center' },
  divided: { borderBottomWidth: 1, borderBottomColor: fixed.borderSoft },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: { fontWeight: '600', fontSize: 18 },
  name: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginBottom: 4 },
  muted: { color: fixed.gray },
  small: { color: fixed.gray, fontSize: 13 },
  meta: { alignItems: 'flex-end', alignSelf: 'flex-start', gap: 8, paddingTop: 2 },
  empty: { textAlign: 'center', paddingVertical: 32 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: fixed.accent,
    color: fixed.white,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    overflow: 'hidden',
  },
  heading: { fontSize: 18, fontWeight: '700', color: fixed.ink, marginTop: 24, marginBottom: 8 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { color: fixed.ink },
  bold: { fontWeight: '700' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: fixed.accent },
});
