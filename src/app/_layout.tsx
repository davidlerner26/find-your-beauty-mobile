import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../i18n';
import { AuthProvider } from '../contexts/auth';
import { FavoritesProvider } from '../contexts/favorites';
import { LocationProvider } from '../contexts/location';
import { ProfessionalsProvider } from '../contexts/professionals';
import { ToastProvider } from '../contexts/toast';
import { ThemeProvider } from '../theme/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <LocationProvider>
            <ProfessionalsProvider>
              <ThemeProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }} />
              </ThemeProvider>
            </ProfessionalsProvider>
          </LocationProvider>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
