import { useLocalSearchParams } from 'expo-router';
import { Chat } from '../../../components/chat';
import { Guard } from '../../../components/guard';

// The chat of a professional with a client (`id` is the conversation)
export default function ProChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Guard kind="pro">
      <Chat id={id} pro />
    </Guard>
  );
}
