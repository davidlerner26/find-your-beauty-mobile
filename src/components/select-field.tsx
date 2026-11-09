import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { fixed } from '../theme/colors';
import { ThemeProvider } from '../theme/theme';
import { Button } from './button';
import { Text } from './text';

export type Option<T> = { value: T; label: string };

type Props<T> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  // Shown while there is no value ("Selecione")
  placeholder?: string;
};

// A dropdown like the select of the site: a bordered field that opens the list of options
export function SelectField<T extends string | null>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder ?? ''}`}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text style={[styles.value, !current && { color: fixed.gray }]} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={26} color={fixed.brand} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        {/* The list is white: it keeps the client theme even inside the blue professional area */}
        <ThemeProvider>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.head}>
              <Text accessibilityRole="header" style={styles.title}>
                {label}
              </Text>
              <Button variant="link" label={t('Cancelar')} onPress={() => setOpen(false)} />
            </View>
            <FlatList
              data={options}
              keyExtractor={(option) => String(option.value)}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={styles.option}
                  >
                    <Text style={[styles.optionText, selected && { color: fixed.brand }]}>
                      {item.label}
                    </Text>
                    {selected ? <MaterialIcons name="check" size={22} color={fixed.brand} /> : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </ThemeProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    borderWidth: 1.5,
    borderColor: fixed.border,
    borderRadius: 14,
    backgroundColor: fixed.white,
  },
  value: { flex: 1, fontSize: 16, color: fixed.ink },
  sheet: { flex: 1, backgroundColor: fixed.white },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: fixed.ink },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: fixed.borderSoft,
  },
  optionText: { fontSize: 16, color: fixed.ink },
});
