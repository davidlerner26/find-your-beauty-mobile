import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Conversation } from '../models/message';
import { followConversations } from '../services/messages';
import { log } from '../utils/log';
import { useAuth } from './auth';

type Messages = {
  conversations: Conversation[];
  unreadTotal: number;
};

const MessagesContext = createContext<Messages | null>(null);

// The conversation list of the signed in user (client or professional), followed live
export function MessagesProvider({ children }: { children: ReactNode }) {
  const uid = useAuth().user?.uid;
  const [followed, setFollowed] = useState<{ uid: string; list: Conversation[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return followConversations(
      uid,
      (list) => setFollowed({ uid, list }),
      (error) => log.error('Failed to load conversations', error),
    );
  }, [uid]);

  const value = useMemo<Messages>(() => {
    const conversations = followed && followed.uid === uid ? followed.list : [];
    return {
      conversations,
      unreadTotal: conversations.reduce((sum, conversation) => sum + conversation.unread, 0),
    };
  }, [followed, uid]);

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const value = useContext(MessagesContext);
  if (!value) throw new Error('useMessages must be used inside MessagesProvider');
  return value;
}
