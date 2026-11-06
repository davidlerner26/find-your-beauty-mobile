import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { useProfessionals } from '../contexts/professionals';
import { useUserLocation } from '../contexts/location';
import { neighborhoodsWith, search, suggestions } from '../utils/search-filter';
import { log } from '../utils/log';
import {
  activeFilterCount,
  initialSearchState,
  isSearching,
  parseRecents,
  SearchAction,
  searchReducer,
  SearchState,
} from './search-reducer';

const RECENTS_KEY = 'recent-searches';

// What the search screen knows: the text, the applied filters, the recent searches and the results they give.
// The filter sheet keeps its own draft in the screen: it only reaches the store when it is applied.
const StateContext = createContext<SearchState | null>(null);
const DispatchContext = createContext<Dispatch<SearchAction> | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, undefined, () => initialSearchState());
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_KEY)
      .then((text) => dispatch({ type: 'loadRecents', recents: parseRecents(text) }))
      .catch((error) => log.warn('Failed to read the recent searches', error))
      .finally(() => (loaded.current = true));
  }, []);

  useEffect(() => {
    // Not before the saved ones were read, or they would be overwritten by an empty list
    if (!loaded.current) return;
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(state.recents)).catch((error) =>
      log.warn('Failed to save the recent searches', error),
    );
  }, [state.recents]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export const useSearchDispatch = () => {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('useSearchDispatch must be used inside SearchProvider');
  return dispatch;
};

// The state of the search plus what comes out of it (results, suggestions, tags, neighborhoods)
export function useSearch() {
  const state = useContext(StateContext);
  if (!state) throw new Error('useSearch must be used inside SearchProvider');
  const { published } = useProfessionals();
  const { position } = useUserLocation();

  return useMemo(() => {
    const allTags = [...new Set(published.flatMap((professional) => professional.tags))];
    return {
      ...state,
      userPosition: position,
      // Tags that exist in the catalog, for the chips
      allTags,
      popular: allTags.slice(0, 6),
      // Only the neighborhoods where there is a professional
      neighborhoods: neighborhoodsWith(published.map((professional) => professional.address)),
      activeFilterCount: activeFilterCount(state),
      searching: isSearching(state),
      results: search(published, state.term, state.applied, position),
      suggestions: suggestions(published, position),
    };
  }, [state, published, position]);
}
