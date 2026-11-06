import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { COLLECTIONS } from '../../shared/domain';
import { ChatMessage, Conversation, MessageContent } from '../models/message';
import { Professional } from '../models/professional';
import { log } from '../utils/log';
import { db, storage } from './firebase';

// What the conversation list shows for the last message
export const preview = (content: MessageContent) =>
  content.text ?? (content.image ? 'Foto' : (content.file?.name ?? ''));

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);

// The id of the conversation of a client with a professional
export const clientConversationId = (clientUid: string, professionalId: string) =>
  `${clientUid}_${professionalId}`;

// Follows the conversations of the user (client or professional), the latest first
export const followConversations = (
  uid: string,
  onList: (list: Conversation[]) => void,
  onError: (error: unknown) => void,
) =>
  onSnapshot(
    query(collection(db, COLLECTIONS.conversations), where('participants', 'array-contains', uid)),
    (snapshot) => {
      const list = snapshot.docs.map((d): Conversation => {
        const data = d.data({ serverTimestamps: 'estimate' });
        const isClient = data['clientUid'] === uid;
        return {
          id: d.id,
          clientUid: data['clientUid'],
          clientName: data['clientName'] ?? '',
          clientImage: data['clientImage'] || undefined,
          professionalId: data['professionalId'],
          lastMessage: data['lastMessage'] ?? '',
          lastMessageAt: toDate(data['lastMessageAt']),
          unread: (isClient ? data['unreadClient'] : data['unreadProfessional']) ?? 0,
        };
      });
      // Sorted here to avoid a composite index
      list.sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));
      onList(list);
    },
    onError,
  );

// Calls `onChange` with every update of the messages of a conversation. Returns the unsubscribe.
export const followMessages = (
  conversationId: string,
  onChange: (messages: ChatMessage[]) => void,
) =>
  onSnapshot(
    query(
      collection(db, COLLECTIONS.conversations, conversationId, COLLECTIONS.messages),
      orderBy('createdAt', 'asc'),
    ),
    (snapshot) =>
      onChange(
        snapshot.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            senderUid: data['senderUid'],
            text: data['text'],
            image: data['image'],
            file: data['file'],
            createdAt: toDate(data['createdAt']),
          };
        }),
      ),
    (error) => log.error('Failed to load messages', error),
  );

// The text of every message of the conversations, so the list can be searched by anything that was said
export const loadConversationTexts = async (conversationIds: string[]) => {
  const loaded = await Promise.all(
    conversationIds.map(async (id) => {
      try {
        const snapshot = await getDocs(
          collection(db, COLLECTIONS.conversations, id, COLLECTIONS.messages),
        );
        const texts = snapshot.docs
          .sort(
            (a, b) => (a.data()['createdAt']?.seconds ?? 0) - (b.data()['createdAt']?.seconds ?? 0),
          )
          .map(
            (d) =>
              (d.data()['text'] as string | undefined) ||
              (d.data()['file']?.name as string | undefined) ||
              '',
          )
          .filter(Boolean);
        return [id, texts] as const;
      } catch (error) {
        log.error('Failed to load the messages of a conversation', error);
        return null;
      }
    }),
  );
  return Object.fromEntries(loaded.filter((entry) => entry !== null));
};

// The client starts (or continues) a conversation with a professional
export const sendAsClient = async (
  user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null },
  professional: Professional,
  content: MessageContent,
) => {
  const conversation = doc(
    db,
    COLLECTIONS.conversations,
    clientConversationId(user.uid, professional.id),
  );
  const message = doc(collection(conversation, COLLECTIONS.messages));

  const batch = writeBatch(db);
  batch.set(message, { senderUid: user.uid, ...content, createdAt: serverTimestamp() });
  batch.set(
    conversation,
    {
      // Demo professionals have no account, so the conversation only has the client
      participants: professional.ownerUid ? [user.uid, professional.ownerUid] : [user.uid],
      clientUid: user.uid,
      clientName: user.displayName || user.email || 'Cliente',
      clientImage: user.photoURL ?? '',
      professionalId: professional.id,
      lastMessage: preview(content),
      lastMessageAt: serverTimestamp(),
      unreadProfessional: increment(1),
    },
    { merge: true },
  );
  await batch.commit();
};

export const sendAsProfessional = async (
  uid: string,
  conversationId: string,
  content: MessageContent,
) => {
  const conversation = doc(db, COLLECTIONS.conversations, conversationId);
  const message = doc(collection(conversation, COLLECTIONS.messages));

  const batch = writeBatch(db);
  batch.set(message, { senderUid: uid, ...content, createdAt: serverTimestamp() });
  batch.update(conversation, {
    lastMessage: preview(content),
    lastMessageAt: serverTimestamp(),
    unreadClient: increment(1),
  });
  await batch.commit();
};

// What a file picked on the phone is: its address on the device, its name and its type
export type PickedFile = { uri: string; name: string; mimeType?: string };

// Uploads a file of the device to the conversation: photos are shown inline, any other file as a link
export const uploadChatFile = async (
  conversationId: string,
  file: PickedFile,
): Promise<MessageContent> => {
  const isImage = !!file.mimeType?.startsWith('image/');
  const name = `${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
  const target = ref(
    storage,
    `chats/${conversationId}/${isImage ? name.replace(/\.[^.]*$/, '') + '.jpg' : name}`,
  );
  const blob = await (await fetch(file.uri)).blob();

  if (isImage) {
    await uploadBytes(target, blob, { contentType: 'image/jpeg' });
    return { image: await getDownloadURL(target) };
  }
  await uploadBytes(target, blob);
  return { file: { url: await getDownloadURL(target), name: file.name } };
};

export const markConversationAsRead = (uid: string, conversation: Conversation) =>
  updateDoc(doc(db, COLLECTIONS.conversations, conversation.id), {
    [uid === conversation.clientUid ? 'unreadClient' : 'unreadProfessional']: 0,
  });
