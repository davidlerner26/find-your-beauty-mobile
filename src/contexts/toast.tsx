import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/text';
import { t } from '../i18n';
import { fixed } from '../theme/colors';

type Toast = { show: (text: string, milliseconds?: number) => void };

type Item = { id: number; text: string };

// More than this at once would cover the screen: the oldest goes away
const MAX = 4;

const ToastContext = createContext<Toast | null>(null);

// Short messages that float on top of any screen to answer an action (the Feedback of the site). One that comes
// right after another does not replace it: both show, one under the other, each going away on its own. The same
// message twice is one message that stays a little longer.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const itemsRef = useRef<Item[]>([]);
  const insets = useSafeAreaInsets();

  const update = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const forget = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  // The X closes one message right away
  const dismiss = useCallback(
    (id: number) => {
      forget(id);
      update(itemsRef.current.filter((item) => item.id !== id));
    },
    [forget, update],
  );

  const later = useCallback(
    (id: number, milliseconds: number) => {
      forget(id);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), milliseconds),
      );
    },
    [dismiss, forget],
  );

  const show = useCallback(
    (message: string, milliseconds = 3500) => {
      const same = itemsRef.current.find((item) => item.text === message);
      if (same) {
        later(same.id, milliseconds);
        return;
      }
      const id = ++nextId.current;
      const kept = itemsRef.current.slice(-(MAX - 1));
      for (const gone of itemsRef.current.filter((item) => !kept.includes(item))) forget(gone.id);
      update([...kept, { id, text: message }]);
      later(id, milliseconds);
    },
    [forget, later, update],
  );
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {items.length ? (
        // On top of the screen, under the status bar. Only the messages take touches: the screen below stays usable.
        <View style={[styles.wrap, { top: insets.top + 12 }]} pointerEvents="box-none">
          {items.map((item) => (
            <View key={item.id} style={styles.toast}>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>
                {item.text}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Fechar')}
                hitSlop={10}
                onPress={() => dismiss(item.id)}
                style={styles.close}
              >
                <MaterialIcons name="close" size={18} color={fixed.white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 448,
    backgroundColor: fixed.ink,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  text: { flex: 1, color: fixed.white },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
