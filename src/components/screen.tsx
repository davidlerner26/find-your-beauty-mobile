import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

type Props = {
  children: ReactNode;
  // Scrolls the content (forms, long pages). Lists that scroll by themselves use `false`.
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
};

// The base of a screen: safe area, theme background, optional scroll, and the keyboard out of the way
export function Screen({ children, scroll = true, padded = true, edges }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: padded ? 24 : 0, gap: 16, flexGrow: 1 }}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: padded ? 24 : 0 }}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
