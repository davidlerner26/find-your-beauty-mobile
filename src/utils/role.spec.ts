import { roleFor } from './role';

describe('roleFor', () => {
  it('is a client when there is no professional document', () => {
    expect(roleFor(null)).toEqual({ role: 'client', pending: false, incomplete: false });
  });

  it('is a professional when approved, or when the account has no approval value', () => {
    expect(roleFor({ approved: true }).role).toBe('professional');
    expect(roleFor({}).role).toBe('professional');
  });

  it('is pending when the sign up was sent and waits for an admin', () => {
    expect(roleFor({ approved: false, submitted: true })).toEqual({
      role: null,
      pending: true,
      incomplete: false,
    });
  });

  it('is incomplete when the sign up was not sent or an admin denied it', () => {
    expect(roleFor({ approved: false, submitted: false })).toEqual({
      role: null,
      pending: false,
      incomplete: true,
    });
    expect(roleFor({ approved: false, submitted: true, rejected: true }).incomplete).toBe(true);
  });
});
