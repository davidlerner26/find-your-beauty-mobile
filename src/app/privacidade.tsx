import { LegalScreen } from '../components/legal-screen';
import { t } from '../i18n';

export default function Privacy() {
  return <LegalScreen page="privacidade" title={t('Política de Privacidade')} />;
}
