import { Guard } from '../../../components/guard';
import { ProProfileForm } from '../../../components/pro-profile-form';

export default function ProProfile() {
  return (
    <Guard kind="pro">
      <ProProfileForm />
    </Guard>
  );
}
