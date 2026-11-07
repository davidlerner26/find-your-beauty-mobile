import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { proTheme } from '../../theme/colors';
import { ThemeProvider } from '../../theme/theme';

// The professional area: /pro (agenda, messages, profile), its login and sign up, and the Instagram return. It has
// its own theme: the blue is the background and the letters are white (body.pro-theme of the site).
export default function ProLayout() {
  return (
    <ThemeProvider pro>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: proTheme.background },
        }}
      />
    </ThemeProvider>
  );
}
