export type Role = 'client' | 'professional';

// What `professionals/{uid}` says about the sign up of an account
export type ProfileStatus = { approved?: boolean; submitted?: boolean; rejected?: boolean } | null;

export type RoleResult = {
  // null while there is no access to the app
  role: Role | null;
  // A professional that sent the sign up and waits for an admin
  pending: boolean;
  // A sign up that was not finished, or that an admin denied: goes back to the second step to be (re)sent
  incomplete: boolean;
};

// The role of a signed-in account from its professional document (null: the account has none, so it is a client).
// Accounts created before approval existed have no `approved` value and count as approved.
export const roleFor = (profile: ProfileStatus): RoleResult => {
  if (!profile) return { role: 'client', pending: false, incomplete: false };
  if (profile.approved === false) {
    if (profile.submitted !== true || profile.rejected === true) {
      return { role: null, pending: false, incomplete: true };
    }
    return { role: null, pending: true, incomplete: false };
  }
  return { role: 'professional', pending: false, incomplete: false };
};
