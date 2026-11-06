import { Redirect } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { PATHS } from '../../utils/paths';

// Where Instagram sends the professional back. The app reads the answer in the browser that opened it (see
// services/instagram.ts), so this screen only brings them back to where they were.
export default function ProInstagram() {
  const { signupIncomplete } = useAuth();
  return <Redirect href={(signupIncomplete ? PATHS.proSignup : PATHS.proProfile) as never} />;
}
