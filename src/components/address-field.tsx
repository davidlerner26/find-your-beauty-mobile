import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInputProps, View } from 'react-native';
import { t } from '../i18n';
import {
  loadPlace,
  newSessionToken,
  Place,
  PlaceSuggestion,
  placesAvailable,
  searchPlaces,
} from '../services/places';
import { fixed } from '../theme/colors';
import { useTheme } from '../theme/theme';
import { log } from '../utils/log';
import { AuthField } from './auth-kit';
import { FormField } from './form-kit';
import { Text } from './text';
import { TextField } from './text-field';

type Props = Pick<TextInputProps, 'placeholder' | 'autoComplete' | 'textContentType'> & {
  label: string;
  value: string;
  // Typing breaks the link with the place that was chosen: the parent clears the position
  onChangeText: (text: string) => void;
  // A suggestion was chosen: the address as Google writes it and where it is on the map
  onPlace: (place: Place) => void;
  // The address has a place on the map (a suggestion was chosen)
  confirmed?: boolean;
  error?: string;
  // 'form' is the light field of the profile forms of the site, 'auth' the pill of the sign up, 'text' the field with
  // the border of the client profile
  variant?: 'text' | 'form' | 'auth';
};

// An address typed with the help of Google Places, like the site: after a pause in the typing the suggestions
// appear under the field, and it only counts once one of them is chosen (that is what gives it a place on the map).
// Without a Google key (see environment.maps) it is a plain field.
export function AddressField({
  label,
  value,
  onChangeText,
  onPlace,
  confirmed,
  error,
  variant = 'text',
  ...input
}: Props) {
  const theme = useTheme();
  const available = placesAvailable();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [problem, setProblem] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // What was typed last: an answer for an older text is dropped
  const latest = useRef(value);
  const session = useRef(newSessionToken());

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (text: string) => {
    onChangeText(text);
    latest.current = text;
    setProblem('');
    clearTimeout(timer.current);
    if (!available || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    // Waits for a pause in the typing, so it does not search on every key
    timer.current = setTimeout(() => {
      searchPlaces(text, session.current)
        .then((found) => text === latest.current && setSuggestions(found))
        .catch(() => {
          if (text !== latest.current) return;
          setSuggestions([]);
          setProblem(t('Não foi possível buscar endereços agora. Tente novamente em instantes.'));
        });
    }, 250);
  };

  const choose = async (suggestion: PlaceSuggestion) => {
    setSuggestions([]);
    try {
      const place = await loadPlace(suggestion, session.current);
      latest.current = place.address;
      onPlace(place);
      // Choosing a place closes the billing session of the search
      session.current = newSessionToken();
    } catch (failure) {
      log.error('Failed to load the place', failure);
      setProblem(t('Não foi possível carregar este endereço. Escolha outro.'));
    }
  };

  const shownError = error || problem || undefined;
  return (
    <View style={styles.wrap}>
      {variant === 'auth' ? (
        <AuthField
          icon="location-on"
          placeholder={label}
          value={value}
          onChangeText={change}
          error={shownError}
          {...input}
        />
      ) : variant === 'form' ? (
        <FormField
          label={label}
          value={value}
          onChangeText={change}
          error={shownError}
          {...input}
        />
      ) : (
        <TextField
          label={label}
          value={value}
          onChangeText={change}
          error={shownError}
          {...input}
        />
      )}
      {suggestions.length ? (
        <View style={styles.list} accessibilityRole="list">
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              accessibilityRole="button"
              accessibilityLabel={suggestion.text}
              onPress={() => void choose(suggestion)}
              style={styles.row}
            >
              <MaterialIcons name="location-on" size={20} color={fixed.brand} />
              <Text style={styles.text}>{suggestion.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {confirmed && !error && !problem ? (
        <Text style={{ color: theme.name === 'pro' ? fixed.white : fixed.success }}>
          ✓ {t('Endereço confirmado.')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  // The suggestions are a light card, also in the professional area
  list: {
    borderRadius: 12,
    backgroundColor: fixed.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: fixed.borderSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: fixed.borderSoft,
  },
  text: { flex: 1, color: fixed.brand },
});
