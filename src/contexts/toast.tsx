import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/text';
import { fixed } from '../theme/colors';

type Toast = { show: (text: string, milliseconds?: number) => void };

const ToastContext = createContext<Toast | null>(null);

// A short message that floats on top of any screen to answer an action (the Feedback of the site)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const current = useRef(0);

  const show = useCallback((message: string, milliseconds = 3500) => {
    const id = ++current.current;
    setText(message);
    setTimeout(() => current.current === id && setText(''), milliseconds);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {text ? (
        <View style={styles.wrap} pointerEvents="none">
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}>
            {text}
          </Text>
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
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 100, alignItems: 'center' },
  toast: {
    backgroundColor: fixed.ink,
    color: fixed.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
});
