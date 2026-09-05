import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeDatePicker, { DatePickerMode } from '../../specs/NativeDatePicker';
import { cardShadow, getThemeColors } from '../theme/colors';
import Button from '../components/Button';

const MODES: { mode: DatePickerMode; label: string; icon: string }[] = [
  { mode: 'date', label: 'Pick Date', icon: '📅' },
  { mode: 'time', label: 'Pick Time', icon: '🕐' },
  { mode: 'datetime', label: 'Pick Date & Time', icon: '🗓️' },
];

export default function DatePickerScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [lastMode, setLastMode] = useState<DatePickerMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyMode, setBusyMode] = useState<DatePickerMode | null>(null);

  const openPicker = useCallback(
    async (mode: DatePickerMode) => {
      setBusyMode(mode);
      setError(null);
      try {
        const result = await NativeDatePicker.open({
          mode,
          value: pickedDate?.getTime(),
        });
        if (!result.cancelled) {
          setPickedDate(new Date(result.value));
          setLastMode(mode);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to open date picker');
      } finally {
        setBusyMode(null);
      }
    },
    [pickedDate],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Choose a mode to open the native picker.
        </Text>

        <View style={styles.buttonRow}>
          {MODES.map(({ mode, label, icon }) => (
            <Button
              key={mode}
              label={label}
              icon={icon}
              onPress={() => openPicker(mode)}
              disabled={busyMode !== null}
              loading={busyMode === mode}
              colors={colors}
              variant={mode === 'date' ? 'primary' : 'secondary'}
              testID={`date-picker-${mode}`}
            />
          ))}
        </View>

        {pickedDate && (
          <View
            style={[
              styles.resultCard,
              cardShadow,
              { backgroundColor: colors.card },
            ]}
          >
            <Text style={styles.resultIcon}>✅</Text>
            <View style={styles.resultTextGroup}>
              <Text style={[styles.resultLabel, { color: colors.textMuted }]}>
                Last picked ({lastMode})
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {pickedDate.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {error && (
          <Text
            style={[styles.error, { color: colors.danger }]}
            testID="date-picker-error"
          >
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  buttonRow: {
    gap: 12,
    marginBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  resultIcon: {
    fontSize: 24,
  },
  resultTextGroup: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
  },
});
