import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { environment } from '../config/environment';
import { INTL_LOCALE } from '../utils/locale';
import { log } from '../utils/log';

const BASE = 'https://places.googleapis.com/v1';

export type PlaceSuggestion = { id: string; text: string };
export type Place = { address: string; position: { lat: number; lng: number } };

type AutocompleteAnswer = {
  suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[];
};
type DetailsAnswer = {
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

// Is there a Google key for the address search? Without it the address fields are plain fields.
export const placesAvailable = () => !!environment.maps.apiKey;

// The suggestions of the answer of the search (a suggestion can also be a query, which is left out)
export const toSuggestions = (answer: AutocompleteAnswer): PlaceSuggestion[] =>
  (answer.suggestions ?? []).flatMap(({ placePrediction }) =>
    placePrediction?.placeId && placePrediction.text?.text
      ? [{ id: placePrediction.placeId, text: placePrediction.text.text }]
      : [],
  );

// The address and the position of the answer of the place (null when it has no position on the map)
export const toPlace = (answer: DetailsAnswer, fallback: string): Place | null => {
  const { latitude, longitude } = answer.location ?? {};
  if (latitude === undefined || longitude === undefined) return null;
  return {
    address: answer.formattedAddress ?? fallback,
    position: { lat: latitude, lng: longitude },
  };
};

// The key of the apps is restricted to them: Google knows the app by its bundle id (iOS) or by its package and the
// SHA-1 of its signing certificate (Android)
const headers = (): Record<string, string> => {
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const androidPackage = Constants.expoConfig?.android?.package;
  const { androidCert } = environment.maps;
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': environment.maps.apiKey,
    ...(Platform.OS === 'ios' && bundleId ? { 'X-Ios-Bundle-Identifier': bundleId } : {}),
    ...(Platform.OS === 'android' && androidPackage && androidCert
      ? { 'X-Android-Package': androidPackage, 'X-Android-Cert': androidCert }
      : {}),
  };
};

// A search session: the suggestions and the choice of one are billed together, so they share a token
export const newSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

// The addresses of Brazil that match what is being typed
export async function searchPlaces(
  input: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE}/places:autocomplete`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ['br'],
      languageCode: INTL_LOCALE,
      regionCode: 'br',
    }),
  });
  if (!response.ok) {
    log.error('Address search failed', new Error(`status ${response.status}`));
    throw new Error('places-search-failed');
  }
  return toSuggestions((await response.json()) as AutocompleteAnswer);
}

// The address (as Google writes it) and the position of a suggestion that was chosen
export async function loadPlace(suggestion: PlaceSuggestion, sessionToken: string): Promise<Place> {
  const url = `${BASE}/places/${suggestion.id}?languageCode=${INTL_LOCALE}&sessionToken=${sessionToken}`;
  const response = await fetch(url, {
    headers: { ...headers(), 'X-Goog-FieldMask': 'formattedAddress,location' },
  });
  if (!response.ok) {
    log.error('Failed to load the place', new Error(`status ${response.status}`));
    throw new Error('place-load-failed');
  }
  const place = toPlace((await response.json()) as DetailsAnswer, suggestion.text);
  if (!place) throw new Error('place-without-location');
  return place;
}
