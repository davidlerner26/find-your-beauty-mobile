import { countFilters, Filters, noFilters, normalize } from '../utils/search-filter';

export const MAX_RECENTS = 5;

export type SearchState = {
  // The text being searched for
  term: string;
  // The filters of the last "Mostrar resultados"
  applied: Filters;
  recents: string[];
};

export type SearchAction =
  | { type: 'setTerm'; term: string }
  // The text was sent (enter, a recent, a chip): it is searched and remembered
  | { type: 'submitTerm'; text: string }
  | { type: 'removeRecent'; recent: string }
  | { type: 'clearRecents' }
  | { type: 'applyFilters'; filters: Filters }
  | { type: 'loadRecents'; recents: string[] };

export const initialSearchState = (recents: string[] = []): SearchState => ({
  term: '',
  applied: noFilters(),
  recents,
});

export const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'setTerm':
      return { ...state, term: action.term };
    case 'submitTerm': {
      const term = action.text.trim();
      if (!term) return { ...state, term };
      const recents = [
        term,
        ...state.recents.filter((recent) => normalize(recent) !== normalize(term)),
      ].slice(0, MAX_RECENTS);
      return { ...state, term, recents };
    }
    case 'removeRecent':
      return { ...state, recents: state.recents.filter((r) => r !== action.recent) };
    case 'clearRecents':
      return { ...state, recents: [] };
    case 'applyFilters':
      return { ...state, applied: { ...action.filters, tags: [...action.filters.tags] } };
    case 'loadRecents':
      return { ...state, recents: action.recents };
  }
};

export const activeFilterCount = (state: SearchState) => countFilters(state.applied);

// Searching (results) or not (suggestions)
export const isSearching = (state: SearchState) =>
  !!state.term.trim() || activeFilterCount(state) > 0;

// Recents come from storage as text: anything that is not a list of texts is ignored
export const parseRecents = (text: string | null): string[] => {
  try {
    const value = JSON.parse(text ?? '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};
