import { noFilters } from '../utils/search-filter';
import {
  activeFilterCount,
  initialSearchState,
  isSearching,
  parseRecents,
  searchReducer,
} from './search-reducer';

describe('searchReducer', () => {
  it('starts with no search', () => {
    const state = initialSearchState();
    expect(isSearching(state)).toBe(false);
    expect(activeFilterCount(state)).toBe(0);
  });

  it('searches as the text changes', () => {
    const state = searchReducer(initialSearchState(), { type: 'setTerm', term: 'ana' });
    expect(state.term).toBe('ana');
    expect(isSearching(state)).toBe(true);
  });

  it('a filter counts as searching even without text', () => {
    const state = searchReducer(initialSearchState(), {
      type: 'applyFilters',
      filters: { ...noFilters(), tags: ['Cabelo'] },
    });
    expect(isSearching(state)).toBe(true);
    expect(activeFilterCount(state)).toBe(1);
  });

  it('keeps its own copy of the filters it is given', () => {
    const draft = { ...noFilters(), tags: ['Cabelo'] };
    const state = searchReducer(initialSearchState(), { type: 'applyFilters', filters: draft });
    draft.tags.push('Maquiagem');
    expect(state.applied.tags).toEqual(['Cabelo']);
  });

  describe('recent searches', () => {
    const submit = (state: ReturnType<typeof initialSearchState>, text: string) =>
      searchReducer(state, { type: 'submitTerm', text });

    it('remembers a sent text, newest first, without repeating it', () => {
      let state = initialSearchState();
      for (const text of ['escova', 'noiva', '  ESCOVA ']) state = submit(state, text);
      expect(state.recents).toEqual(['ESCOVA', 'noiva']);
      expect(state.term).toBe('ESCOVA');
    });

    it('keeps the last 5', () => {
      let state = initialSearchState();
      for (const text of ['a', 'b', 'c', 'd', 'e', 'f']) state = submit(state, text);
      expect(state.recents).toEqual(['f', 'e', 'd', 'c', 'b']);
    });

    it('does not remember an empty text, but clears the search', () => {
      let state = searchReducer(initialSearchState(), { type: 'setTerm', term: 'ana' });
      state = submit(state, '   ');
      expect(state.term).toBe('');
      expect(state.recents).toEqual([]);
    });

    it('removes one or all', () => {
      let state = submit(submit(initialSearchState(), 'a'), 'b');
      state = searchReducer(state, { type: 'removeRecent', recent: 'a' });
      expect(state.recents).toEqual(['b']);
      state = searchReducer(state, { type: 'clearRecents' });
      expect(state.recents).toEqual([]);
    });
  });
});

describe('parseRecents', () => {
  it('reads the saved list and survives a broken value', () => {
    expect(parseRecents(JSON.stringify(['x', 'y']))).toEqual(['x', 'y']);
    expect(parseRecents('{not json')).toEqual([]);
    expect(parseRecents(null)).toEqual([]);
    expect(parseRecents(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(parseRecents(JSON.stringify(['x', 3]))).toEqual(['x']);
  });
});
