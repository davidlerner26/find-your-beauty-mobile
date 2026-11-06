import { filterConversations, Row } from './inbox-search';

const row = (id: string, title: string, lastMessage = ''): Row => ({
  id,
  title,
  clientUid: 'c',
  clientName: 'C',
  professionalId: 'p',
  lastMessage,
  lastMessageAt: null,
  unread: 0,
});
const rows = [row('1', 'Ana Paula', 'oi'), row('2', 'Bia', 'tchau')];

describe('filterConversations', () => {
  it('shows everything without a search', () => {
    expect(filterConversations(rows, '  ', {})).toEqual(rows);
  });

  it('finds by name, ignoring case and accents', () => {
    expect(filterConversations(rows, 'ANA', {}).map((r) => r.id)).toEqual(['1']);
    expect(filterConversations([row('3', 'Júlia')], 'julia', {})).toHaveLength(1);
  });

  it('finds by what was said and shows that message', () => {
    const found = filterConversations(rows, 'não posso', { '2': ['Oi', 'Hoje NÃO posso ir'] });
    expect(found.map((r) => [r.id, r.lastMessage])).toEqual([['2', 'Hoje NÃO posso ir']]);
  });

  it('finds nothing when nothing matches', () => {
    expect(filterConversations(rows, 'zzz', { '1': ['oi'] })).toEqual([]);
  });
});
