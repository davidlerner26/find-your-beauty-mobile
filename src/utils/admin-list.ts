import { Professional } from '../models/professional';

export type PendingProfessional = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date | null;
};

type ProfessionalDoc = { id: string; data: Record<string, unknown> };

// The accounts that finished the sign up (second step) and wait for an admin, oldest first. Accounts that did not
// send the profile yet, and the ones an admin denied, are not in the list.
export const pendingList = (docs: ProfessionalDoc[], toDate: (value: unknown) => Date | null) =>
  docs
    .filter(({ data }) => data['submitted'] === true && data['rejected'] !== true)
    .map(({ id, data }): PendingProfessional => ({
      id,
      name: (data['name'] as string | undefined) ?? '',
      email: (data['email'] as string | undefined) ?? '',
      phone: (data['phone'] as string | undefined) ?? '',
      createdAt: toDate(data['createdAt']),
    }))
    .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

export type ApprovalStatus = 'waiting' | 'denied' | 'approved';

// Where an account is in the approval
export const approvalStatus = (professional: Pick<Professional, 'approved' | 'rejected'>) =>
  professional.approved === false ? (professional.rejected ? 'denied' : 'waiting') : 'approved';
