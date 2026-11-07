import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import '../i18n';
import { AuthProvider } from '../contexts/auth';
import { BookingsProvider } from '../contexts/bookings';
import { CheckoutDraftProvider } from '../contexts/checkout-draft';
import { FavoritesProvider } from '../contexts/favorites';
import { LocationProvider } from '../contexts/location';
import { MessagesProvider } from '../contexts/messages';
import { NotificationsProvider } from '../contexts/notifications';
import { ProfessionalsProvider } from '../contexts/professionals';
import { ToastProvider } from '../contexts/toast';
import { TestBanner } from '../components/test-banner';
import { FONTS } from '../theme/fonts';
import { ThemeProvider } from '../theme/theme';

// The splash stays until the font is there, so the text never shows in another one first
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(FONTS);
  // A font that fails to load must not keep the app from opening: the system font takes over
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <LocationProvider>
            <ProfessionalsProvider>
              <ThemeProvider>
                <BookingsProvider>
                  <MessagesProvider>
                    <NotificationsProvider>
                      <CheckoutDraftProvider>
                        <StatusBar style="dark" />
                        <Stack screenOptions={{ headerShown: false }} />
                        <TestBanner />
                      </CheckoutDraftProvider>
                    </NotificationsProvider>
                  </MessagesProvider>
                </BookingsProvider>
              </ThemeProvider>
            </ProfessionalsProvider>
          </LocationProvider>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
