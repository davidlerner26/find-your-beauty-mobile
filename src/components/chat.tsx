import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { Link } from './link';
import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from './text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';
import { useMessages } from '../contexts/messages';
import { useProfessionals } from '../contexts/professionals';
import { useToast } from '../contexts/toast';
import { t } from '../i18n';
import { ChatMessage, MessageContent } from '../models/message';
import { resizeForUpload } from '../services/images';
import {
  clientConversationId,
  followMessages,
  markConversationAsRead,
  PickedFile,
  sendAsClient,
  sendAsProfessional,
  uploadChatFile,
} from '../services/messages';
import { fixed, radius } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { formatClock } from '../utils/format-date';
import { focusPosition } from '../utils/labels';
import { log } from '../utils/log';
import { PATHS } from '../utils/paths';
import { BackButton } from './back-button';
import { Spinner } from './spinner';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// `id` is the professional id for clients and the conversation id in the professional area
export function Chat({ id, pro = false }: { id: string; pro?: boolean }) {
  const theme = useTheme();
  const auth = useAuth();
  const toast = useToast();
  const { conversations } = useMessages();
  const professionals = useProfessionals();
  const user = auth.user;
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);

  const conversationId = pro ? id : user ? clientConversationId(user.uid, id) : '';
  const conversation = conversations.find((item) => item.id === conversationId);
  const professional = professionals.byId(pro ? (conversation?.professionalId ?? '') : id);

  // Who is on the other side: the professional for clients, the client for professionals
  const peer = useMemo(() => {
    if (pro) {
      return conversation
        ? {
            name: conversation.clientName,
            image: conversation.clientImage ?? null,
            position: undefined,
          }
        : null;
    }
    return professional
      ? { name: professional.name, image: professional.image, position: professional.imagePosition }
      : null;
  }, [pro, conversation, professional]);

  // Live messages of this conversation
  useEffect(() => {
    if (!conversationId) return;
    return followMessages(conversationId, setMessages);
  }, [conversationId]);

  // Opening the conversation clears its unread counter
  useEffect(() => {
    if (user && conversation?.unread) {
      markConversationAsRead(user.uid, conversation).catch((error) =>
        log.error('Failed to mark the conversation as read', error),
      );
    }
  }, [user, conversation]);

  const deliver = (content: MessageContent) => {
    if (!user) return null;
    if (pro) return sendAsProfessional(user.uid, conversationId, content);
    return professional ? sendAsClient(user, professional, content) : null;
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    deliver({ text })?.catch((error) => {
      log.error('Failed to send message', error);
      // The text goes back to the field, so nothing is lost
      setDraft((current) => current || text);
      toast.show(t('Não foi possível enviar a mensagem. Tente novamente.'));
    });
  };

  const sendFiles = async (files: (PickedFile & { size?: number })[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        if ((file.size ?? 0) > MAX_FILE_SIZE) {
          toast.show(t('Cada arquivo pode ter até 10 MB.'));
          continue;
        }
        await deliver(await uploadChatFile(conversationId, file));
      }
    } catch (error) {
      log.error('Failed to send file', error);
      toast.show(t('Não foi possível enviar o arquivo. Tente novamente.'));
    } finally {
      setUploading(false);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;
    try {
      const files = await Promise.all(
        result.assets.map(async (asset) => ({
          uri: await resizeForUpload(asset.uri, asset.width, asset.height),
          name: asset.fileName ?? 'foto.jpg',
          mimeType: 'image/jpeg',
        })),
      );
      await sendFiles(files);
    } catch (error) {
      log.error('Failed to prepare the photos', error);
      toast.show(t('Não foi possível enviar o arquivo. Tente novamente.'));
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (result.canceled) return;
    await sendFiles(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      })),
    );
  };

  // The clip button: a photo of the library or any other file of the device
  const attach = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('Cancelar'), t('Foto'), t('Arquivo')], cancelButtonIndex: 0 },
        (index) => void (index === 1 ? pickPhoto() : index === 2 ? pickFile() : undefined),
      );
    } else {
      void pickPhoto();
    }
  };

  const mine = (message: ChatMessage) => message.senderUid === user?.uid;

  // A visitor has no conversations: signs in first
  if (auth.ready && !user) return <Redirect href={PATHS.login as never} />;

  const avatar = (size: 'big' | 'small') =>
    peer?.image ? (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: peer.image }}
        contentFit="cover"
        contentPosition={focusPosition(peer.position)}
        style={size === 'big' ? styles.avatar : styles.avatarSmall}
      />
    ) : (
      <View
        style={[
          size === 'big' ? styles.avatar : styles.avatarSmall,
          { backgroundColor: theme.primaryLight },
        ]}
      >
        <Text style={[styles.avatarLetter, { color: theme.primary }]}>{peer?.name[0]}</Text>
      </View>
    );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: theme.line }]}>
          <BackButton />
          {peer ? (
            <>
              {avatar('big')}
              {!pro && professional ? (
                <Link href={PATHS.professional(professional.id) as never} accessibilityRole="link">
                  <Text style={[styles.peer, { color: theme.text }]}>{peer.name}</Text>
                </Link>
              ) : (
                <Text style={[styles.peer, { color: theme.text }]}>{peer.name}</Text>
              )}
            </>
          ) : null}
        </View>

        {messages === null ? (
          <Spinner />
        ) : (
          <FlatList
            data={[...messages].reverse()}
            inverted
            keyExtractor={(message) => message.id}
            style={{ backgroundColor: theme.chatBg }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.muted }]}>
                {peer
                  ? t('Envie uma mensagem para {{name}}.', { name: peer.name })
                  : t('Envie uma mensagem para começar a conversa.')}
              </Text>
            }
            renderItem={({ item }) => {
              const own = mine(item);
              const ink = own ? theme.onBubbleMine : theme.onBubble;
              return (
                <View style={[styles.row, own && styles.rowMine]}>
                  {!own ? avatar('small') : null}
                  <View style={[styles.stack, own && styles.stackMine]}>
                    <View
                      style={[
                        styles.bubble,
                        { backgroundColor: own ? theme.bubbleMine : theme.bubble },
                        item.image && styles.bubbleImage,
                      ]}
                    >
                      {item.image ? (
                        <Pressable
                          accessibilityRole="imagebutton"
                          accessibilityLabel={t('Foto')}
                          onPress={() => void Linking.openURL(item.image!)}
                        >
                          <Image
                            accessibilityIgnoresInvertColors
                            source={{ uri: item.image }}
                            contentFit="cover"
                            style={styles.photo}
                          />
                        </Pressable>
                      ) : null}
                      {item.file ? (
                        <Pressable
                          accessibilityRole="link"
                          accessibilityLabel={item.file.name}
                          onPress={() => void Linking.openURL(item.file!.url)}
                          style={styles.file}
                        >
                          <MaterialIcons name="attach-file" size={18} color={ink} />
                          <Text style={[styles.fileName, { color: ink }]}>{item.file.name}</Text>
                        </Pressable>
                      ) : null}
                      {item.text ? (
                        <Text style={[styles.text, { color: ink }]}>{item.text}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.time, { color: theme.muted }]}>
                      {formatClock(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {uploading ? (
          <Text style={[styles.note, { color: theme.muted }]}>{t('Enviando arquivo...')}</Text>
        ) : null}
        <View style={[styles.composer, { borderTopColor: theme.line }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Anexar')}
            disabled={uploading}
            onPress={attach}
            hitSlop={6}
            style={{ opacity: uploading ? 0.4 : 1 }}
          >
            <MaterialIcons name="attach-file" size={26} color={theme.primary} />
          </Pressable>
          <TextInput
            accessibilityLabel={t('Mensagem')}
            placeholder={t('Digite uma mensagem')}
            placeholderTextColor={fixed.gray}
            value={draft}
            onChangeText={setDraft}
            multiline
            style={[styles.input, { backgroundColor: theme.field }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Enviar')}
            disabled={!draft.trim()}
            onPress={send}
            style={[
              styles.send,
              { backgroundColor: theme.primary },
              !draft.trim() && { opacity: 0.4 },
            ]}
          >
            <MaterialIcons name="send" size={22} color={theme.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: { fontWeight: '600' },
  peer: { fontSize: 17, fontWeight: '700' },
  list: { padding: 16, paddingVertical: 24, gap: 20 },
  empty: { textAlign: 'center', padding: 24, transform: [{ scaleY: -1 }] },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  rowMine: { justifyContent: 'flex-end' },
  stack: { maxWidth: '70%', gap: 6 },
  stackMine: { alignItems: 'flex-end' },
  bubble: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.card, gap: 6 },
  bubbleImage: { padding: 8 },
  text: { fontSize: 16 },
  time: { fontSize: 12 },
  photo: { width: 160, height: 160, borderRadius: 8 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fileName: { textDecorationLine: 'underline' },
  note: { paddingHorizontal: 16, paddingTop: 8, fontSize: 14 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    color: fixed.ink,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
