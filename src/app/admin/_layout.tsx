import { Stack } from 'expo-router';
import { Guard } from '../../components/guard';

// Only accounts with `admin: true` get in (the rules check the same field)
export default function AdminLayout() {
  return (
    <Guard kind="admin">
      <Stack screenOptions={{ headerShown: false }} />
    </Guard>
  );
}
