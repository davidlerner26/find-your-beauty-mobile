import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { log } from '../utils/log';
import { FRESH_MS, parseLastPosition, Position } from '../utils/last-position';

const LAST_KEY = 'last-position';

type UserLocation = {
  position: Position | null;
  permission: 'unknown' | 'granted' | 'denied' | 'undetermined';
  requesting: boolean;
  // Asks for the position. Resolves to false when it was denied or failed.
  request: () => Promise<boolean>;
};

const LocationContext = createContext<UserLocation | null>(null);

// Where the user is. The system prompt only shows when a screen calls `request`.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [permission, setPermission] = useState<UserLocation['permission']>('unknown');
  const [requesting, setRequesting] = useState(false);

  const locate = useCallback(async () => {
    setRequesting(true);
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { lat: coords.latitude, lng: coords.longitude };
      setPosition(next);
      await AsyncStorage.setItem(
        LAST_KEY,
        JSON.stringify({ position: next, at: Date.now() }),
      ).catch((error) => log.warn('Failed to remember the position', error));
      return true;
    } catch (error) {
      log.warn('Failed to read the position', error);
      return false;
    } finally {
      setRequesting(false);
    }
  }, []);

  const request = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    return status === 'granted' ? locate() : false;
  }, [locate]);

  useEffect(() => {
    // Already allowed before: no need to ask again. The last position shows up at once, and a new one is only
    // read when it is old.
    void (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermission(status);
      if (status !== 'granted') return;
      const last = parseLastPosition(await AsyncStorage.getItem(LAST_KEY).catch(() => null));
      if (last) setPosition(last.position);
      if (!last || Date.now() - last.at > FRESH_MS) await locate();
    })().catch((error) => log.warn('Failed to start the location', error));
  }, [locate]);

  const value = useMemo(
    () => ({ position, permission, requesting, request }),
    [position, permission, requesting, request],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation() {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useUserLocation must be used inside LocationProvider');
  return value;
}
