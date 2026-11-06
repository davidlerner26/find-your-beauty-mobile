import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'expo-router';
import { t } from '../i18n';
import { addFavorite, followFavorites, removeFavorite } from '../services/favorites';
import { log } from '../utils/log';
import { PATHS } from '../utils/paths';
import { useAuth } from './auth';
import { useToast } from './toast';

type Favorites = {
  ids: string[];
  // Visitors don't see the heart: favorites belong to an account
  available: boolean;
  has: (professionalId: string) => boolean;
  // Hearts or un-hearts. Visitors are sent to the login.
  toggle: (professionalId: string) => Promise<void>;
};

const FavoritesContext = createContext<Favorites | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();
  // The favorites come with the account they belong to, so an old account's list never shows for a new one
  const [followed, setFollowed] = useState<{ uid: string; ids: string[] } | null>(null);
  const uid = auth.user?.uid;
  const isClient = auth.role === 'client';

  useEffect(() => {
    if (!uid || !isClient) return;
    return followFavorites(
      uid,
      (list) => setFollowed({ uid, ids: list }),
      (error) => log.error('Failed to load favorites', error),
    );
  }, [uid, isClient]);

  const ids = useMemo(
    () => (followed && followed.uid === uid && isClient ? followed.ids : []),
    [followed, uid, isClient],
  );

  const toggle = useCallback(
    async (professionalId: string) => {
      if (!uid) {
        router.push(PATHS.login as never);
        return;
      }
      if (!isClient) return;
      const removing = ids.includes(professionalId);
      try {
        if (removing) await removeFavorite(uid, professionalId);
        else await addFavorite(uid, professionalId);
        toast.show(removing ? t('Removido dos favoritos') : t('Adicionado aos favoritos'), 2500);
      } catch (error) {
        toast.show(t('Não foi possível atualizar os favoritos. Tente novamente.'));
        log.error('Failed to update favorite', error);
      }
    },
    [uid, isClient, ids, router, toast],
  );

  const value = useMemo<Favorites>(
    () => ({ ids, available: !!uid, has: (id) => ids.includes(id), toggle }),
    [ids, uid, toggle],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites must be used inside FavoritesProvider');
  return value;
}
