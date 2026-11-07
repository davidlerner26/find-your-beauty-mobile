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
import { fixed } from '../theme/colors';
import { formatClock } from '../utils/format-date';
import { focusPosition } from '../utils/labels';
import { log } from '../utils/log';
import { PATHS } from '../utils/paths';
import { BackButton } from './back-button';
import { Spinner } from './spinner';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// `id` is the professional id for clients and the conversation id in the professional area
export function Chat({ id, pro = false }: { id: string; pro?: boolean }) {
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

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton />
          {peer ? (
            <>
              {peer.image ? (
                <Image
                  accessibilityIgnoresInvertColors
                  source={{ uri: peer.image }}
                  contentFit="cover"
                  contentPosition={focusPosition(peer.position)}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{peer.name[0]}</Text>
                </View>
              )}
              {!pro && professional ? (
                <Link href={PATHS.professional(professional.id) as never} accessibilityRole="link">
                  <Text style={styles.peer}>{peer.name}</Text>
                </Link>
              ) : (
                <Text style={styles.peer}>{peer.name}</Text>
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
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('Envie uma mensagem para começar a conversa.')}</Text>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, mine(item) ? styles.mine : styles.theirs]}>
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
                    <MaterialIcons
                      name="attach-file"
                      size={18}
                      color={mine(item) ? fixed.white : fixed.ink}
                    />
                    <Text style={[styles.text, mine(item) && styles.textMine]}>
                      {item.file.name}
                    </Text>
                  </Pressable>
                ) : null}
                {item.text ? (
                  <Text style={[styles.text, mine(item) && styles.textMine]}>{item.text}</Text>
                ) : null}
                <Text style={[styles.time, mine(item) && styles.timeMine]}>
                  {formatClock(item.createdAt)}
                </Text>
              </View>
            )}
          />
        )}

        <View style={styles.composer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Anexar')}
            disabled={uploading}
            onPress={attach}
            hitSlop={6}
            style={{ opacity: uploading ? 0.4 : 1 }}
          >
            <MaterialIcons name="attach-file" size={26} color={fixed.gray} />
          </Pressable>
          <TextInput
            accessibilityLabel={t('Mensagem')}
            placeholder={t('Escreva uma mensagem')}
            placeholderTextColor={fixed.gray}
            value={draft}
            onChangeText={setDraft}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Enviar')}
            disabled={!draft.trim()}
            onPress={send}
            style={[styles.send, !draft.trim() && { opacity: 0.4 }]}
          >
            <MaterialIcons name="send" size={20} color={fixed.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fixed.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: fixed.borderSoft,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fixed.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '700', color: fixed.brand },
  peer: { fontSize: 17, fontWeight: '700', color: fixed.ink },
  list: { padding: 12, gap: 8 },
  empty: { color: fixed.gray, textAlign: 'center', padding: 24, transform: [{ scaleY: -1 }] },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: fixed.brand },
  theirs: { alignSelf: 'flex-start', backgroundColor: fixed.surface },
  text: { color: fixed.ink, fontSize: 16 },
  textMine: { color: fixed.white },
  time: { color: fixed.gray, fontSize: 11, alignSelf: 'flex-end' },
  timeMine: { color: fixed.white },
  photo: { width: 220, height: 220, borderRadius: 10 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: fixed.borderSoft,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: fixed.surface,
    fontSize: 16,
    color: fixed.ink,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: fixed.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
