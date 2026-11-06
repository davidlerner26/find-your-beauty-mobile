import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Booking } from '../models/booking';
import { followBookings } from '../services/bookings';
import { log } from '../utils/log';
import { useAuth } from './auth';

type Bookings = {
  // Requests received by the signed in professional
  received: Booking[];
  // Bookings made by the signed in client
  mine: Booking[];
  mineLoading: boolean;
};

const BookingsContext = createContext<Bookings | null>(null);

// The bookings of the signed in user, followed live (as a client and as a professional)
export function BookingsProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const uid = auth.user?.uid;
  const role = auth.role;
  // Each list comes with the account it belongs to, so one account's list never shows for another
  const [mine, setMine] = useState<{ uid: string; list: Booking[] } | null>(null);
  const [received, setReceived] = useState<{ uid: string; list: Booking[] } | null>(null);

  useEffect(() => {
    if (!uid || role !== 'client') return;
    return followBookings(
      'clientUid',
      uid,
      (list) => setMine({ uid, list }),
      (error) => log.error('Failed to load bookings', error),
    );
  }, [uid, role]);

  useEffect(() => {
    if (!uid || role !== 'professional') return;
    return followBookings(
      'professionalUid',
      uid,
      (list) => setReceived({ uid, list }),
      (error) => log.error('Failed to load the requests', error),
    );
  }, [uid, role]);

  const value = useMemo<Bookings>(() => {
    const mineList = mine && mine.uid === uid && role === 'client' ? mine.list : [];
    return {
      mine: mineList,
      received: received && received.uid === uid && role === 'professional' ? received.list : [],
      mineLoading: !!uid && role === 'client' && !(mine && mine.uid === uid),
    };
  }, [mine, received, uid, role]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const value = useContext(BookingsContext);
  if (!value) throw new Error('useBookings must be used inside BookingsProvider');
  return value;
}
