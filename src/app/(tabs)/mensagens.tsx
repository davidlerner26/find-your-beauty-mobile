import { SafeAreaView } from 'react-native-safe-area-context';
import { Guard } from '../../components/guard';
import { Inbox } from '../../components/inbox';
import { fixed } from '../../theme/colors';
import { PATHS } from '../../utils/paths';

export default function MessagesScreen() {
  return (
    <Guard kind="clientArea" proPath={PATHS.proMessages}>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: fixed.white }}>
        <Inbox />
      </SafeAreaView>
    </Guard>
  );
}
