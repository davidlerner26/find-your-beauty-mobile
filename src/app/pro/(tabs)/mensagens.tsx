import { SafeAreaView } from 'react-native-safe-area-context';
import { Guard } from '../../../components/guard';
import { Inbox } from '../../../components/inbox';
import { useTheme } from '../../../theme/theme';

export default function ProMessages() {
  const theme = useTheme();
  return (
    <Guard kind="pro">
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
        <Inbox pro />
      </SafeAreaView>
    </Guard>
  );
}
