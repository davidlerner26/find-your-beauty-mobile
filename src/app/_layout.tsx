import { Stack } from 'expo-router';
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
import { ThemeProvider } from '../theme/theme';

export default function RootLayout() {
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
