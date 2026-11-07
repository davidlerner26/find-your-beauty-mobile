import { approvalStatus, pendingList } from './admin-list';

const date = (value: unknown) => (value instanceof Date ? value : null);

describe('pendingList', () => {
  it('keeps the sign ups that were sent and not denied, the oldest first', () => {
    const list = pendingList(
      [
        { id: 'new', data: { submitted: true, name: 'Nova', createdAt: new Date(2099, 1, 2) } },
        { id: 'old', data: { submitted: true, name: 'Antiga', createdAt: new Date(2099, 1, 1) } },
        { id: 'draft', data: { submitted: false, name: 'Rascunho' } },
        { id: 'legacy', data: { name: 'Sem campo' } },
        { id: 'denied', data: { submitted: true, rejected: true } },
      ],
      date,
    );
    expect(list.map((item) => item.id)).toEqual(['old', 'new']);
  });

  it('fills what is missing and puts the ones with no date first', () => {
    const [first] = pendingList(
      [
        { id: 'a', data: { submitted: true, createdAt: new Date(2099, 1, 1) } },
        { id: 'b', data: { submitted: true } },
      ],
      date,
    );
    expect(first).toEqual({ id: 'b', name: '', email: '', phone: '', createdAt: null });
  });
});

describe('approvalStatus', () => {
  it('tells waiting, denied and approved (an account with no value counts as approved)', () => {
    expect(approvalStatus({ approved: false })).toBe('waiting');
    expect(approvalStatus({ approved: false, rejected: true })).toBe('denied');
    expect(approvalStatus({ approved: true })).toBe('approved');
    expect(approvalStatus({})).toBe('approved');
  });
});
