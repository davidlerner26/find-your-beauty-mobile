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

const ToastContext = createContext<Toast | null>(null);

// A short message that floats on top of any screen to answer an action (the Feedback of the site)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const current = useRef(0);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, milliseconds = 3500) => {
    const id = ++current.current;
    setText(message);
    setTimeout(() => current.current === id && setText(''), milliseconds);
  }, []);
  // The X closes it right away
  const dismiss = useCallback(() => {
    current.current++;
    setText('');
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {text ? (
        // On top of the screen, under the status bar. Only the message takes touches: the screen below stays usable.
        <View style={[styles.wrap, { top: insets.top + 12 }]} pointerEvents="box-none">
          <View style={styles.toast}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>
              {text}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Fechar')}
              hitSlop={10}
              onPress={dismiss}
              style={styles.close}
            >
              <MaterialIcons name="close" size={18} color={fixed.white} />
            </Pressable>
          </View>
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
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
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
