import { Conversation } from '../models/message';

// Ignores the case and the accents, so "nao" finds "não"
export const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export type Row = Conversation & { title: string };

// Looks in the name and in everything that was said; a match in a message shows that message instead of the last one
export const filterConversations = (
  rows: Row[],
  search: string,
  texts: Record<string, string[]>,
): Row[] => {
  const term = fold(search.trim());
  if (!term) return rows;

  return rows.flatMap((row) => {
    if (fold(row.title).includes(term)) return [row];
    const found = (texts[row.id] ?? []).find((text) => fold(text).includes(term));
    return found ? [{ ...row, lastMessage: found }] : [];
  });
};
