import { SafeAreaView } from 'react-native-safe-area-context';
import { Guard } from '../../../components/guard';
import { Inbox } from '../../../components/inbox';
import { fixed } from '../../../theme/colors';

export default function ProMessages() {
  return (
    <Guard kind="pro">
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: fixed.white }}>
        <Inbox pro />
      </SafeAreaView>
    </Guard>
  );
}
