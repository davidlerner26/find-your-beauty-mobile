import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../shared/domain';
import { Notification } from '../models/message';
import { db } from './firebase';

// users/{uid}/notifications, the latest first
export const followNotifications = (
  uid: string,
  onList: (list: Notification[]) => void,
  onError: (error: unknown) => void,
) =>
  onSnapshot(
    query(
      collection(db, COLLECTIONS.users, uid, COLLECTIONS.notifications),
      orderBy('createdAt', 'desc'),
    ),
    (snapshot) =>
      onList(
        snapshot.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            icon: data['icon'],
            text: data['text'] ?? [],
            unread: !!data['unread'],
            createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : null,
          };
        }),
      ),
    onError,
  );

// Opening a notification marks it as read
export const markNotificationAsRead = (uid: string, id: string) =>
  updateDoc(doc(db, COLLECTIONS.users, uid, COLLECTIONS.notifications, id), { unread: false });
