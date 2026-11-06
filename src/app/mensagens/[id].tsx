import { useLocalSearchParams } from 'expo-router';
import { Chat } from '../../components/chat';
import { Guard } from '../../components/guard';
import { PATHS } from '../../utils/paths';

// The chat of a client with a professional (`id` is the professional)
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Guard kind="clientArea" proPath={PATHS.proMessages}>
      <Chat id={id} />
    </Guard>
  );
}
