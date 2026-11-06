import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Notification } from '../models/message';
import { followNotifications } from '../services/notifications';
import { log } from '../utils/log';
import { useAuth } from './auth';

type Notifications = {
  list: Notification[];
  loading: boolean;
  unreadTotal: number;
};

const NotificationsContext = createContext<Notifications | null>(null);

// users/{uid}/notifications of the signed in user, followed live
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const uid = useAuth().user?.uid;
  const [followed, setFollowed] = useState<{ uid: string; list: Notification[] } | null>(null);

  useEffect(() => {
    if (!uid) return;
    return followNotifications(
      uid,
      (list) => setFollowed({ uid, list }),
      (error) => log.error('Failed to load notifications', error),
    );
  }, [uid]);

  const value = useMemo<Notifications>(() => {
    const list = followed && followed.uid === uid ? followed.list : [];
    return {
      list,
      loading: !!uid && !(followed && followed.uid === uid),
      unreadTotal: list.filter((notification) => notification.unread).length,
    };
  }, [followed, uid]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationsProvider');
  return value;
}
