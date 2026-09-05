import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeMobileDeviceInfo, {
  NativeDeviceInfoResult,
} from '../../specs/NativeMobileDeviceInfo';
import { formatBytes, formatPercent } from '../nativeDeviceInfo/formatters';
import type { RootStackScreenProps } from '../../App';
import { cardShadow, getThemeColors, ThemeColors } from '../theme/colors';
import Button from '../components/Button';

type Row = { label: string; value: string };
type Section = { id: string; icon: string; title: string; rows: Row[] };

function BatteryBar({ level, colors }: { level: number; colors: ThemeColors }) {
  if (!Number.isFinite(level) || level < 0) {
    return null;
  }
  const pct = Math.max(0, Math.min(1, level));
  const barColor = pct <= 0.2 ? colors.danger : colors.success;
  return (
    <View style={[styles.batteryTrack, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.batteryFill,
          { width: `${pct * 100}%`, backgroundColor: barColor },
        ]}
      />
    </View>
  );
}

function Card({
  section,
  colors,
  footer,
}: {
  section: Section;
  colors: ThemeColors;
  footer?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, cardShadow, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{section.icon}</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {section.title}
        </Text>
      </View>
      {section.rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
            { borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
            {row.label}
          </Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {row.value}
          </Text>
        </View>
      ))}
      {footer}
    </View>
  );
}

const buildSections = (info: NativeDeviceInfoResult): Section[] => [
  {
    id: 'hardware',
    icon: '🖥️',
    title: 'Hardware',
    rows: [
      { label: 'Model', value: info.hardware.model },
      { label: 'Manufacturer', value: info.hardware.manufacturer },
      {
        label: 'OS',
        value: `${info.hardware.osName} ${info.hardware.osVersion}`,
      },
      {
        label: 'Screen',
        value: `${info.hardware.screenWidth}x${info.hardware.screenHeight} @${info.hardware.screenDensity}x`,
      },
    ],
  },
  {
    id: 'battery',
    icon: '🔋',
    title: 'Battery & Storage',
    rows: [
      { label: 'Battery level', value: formatPercent(info.battery.level) },
      { label: 'Charging', value: info.battery.isCharging ? 'Yes' : 'No' },
      { label: 'Total storage', value: formatBytes(info.storage.totalStorage) },
      { label: 'Free storage', value: formatBytes(info.storage.freeStorage) },
    ],
  },
  {
    id: 'network',
    icon: '🌐',
    title: 'Network',
    rows: [
      { label: 'Connection', value: info.network.connectionType },
      { label: 'IP address', value: info.network.ipAddress || 'Unknown' },
      { label: 'Carrier', value: info.network.carrierName || 'Unavailable' },
    ],
  },
  {
    id: 'app',
    icon: '📦',
    title: 'App & Identifiers',
    rows: [
      { label: 'App version', value: info.app.appVersion },
      { label: 'Build number', value: info.app.buildNumber },
      { label: 'Bundle ID', value: info.app.bundleId },
      { label: 'Device ID', value: info.app.deviceId },
    ],
  },
];

export default function DeviceInfoScreen({
  navigation,
}: RootStackScreenProps<'DeviceInfo'>) {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);
  const [info, setInfo] = useState<NativeDeviceInfoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await NativeMobileDeviceInfo.getDeviceInfo();
      setInfo(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load device info');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const subscription = NativeMobileDeviceInfo.onBatteryLevelChanged(
      battery => {
        setInfo(current => (current ? { ...current, battery } : current));
      },
    );
    return () => subscription.remove();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {info && (
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>📱</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {info.hardware.model}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              {info.hardware.osName} {info.hardware.osVersion}
            </Text>
          </View>
        )}

        {error && (
          <Text
            style={[styles.error, { color: colors.danger }]}
            testID="device-info-error"
          >
            {error}
          </Text>
        )}

        {!info && !error && (
          <Text
            style={[styles.loading, { color: colors.textMuted }]}
            testID="device-info-loading"
          >
            Loading…
          </Text>
        )}

        {info &&
          buildSections(info).map(section => (
            <Card
              key={section.id}
              section={section}
              colors={colors}
              footer={
                section.id === 'battery' ? (
                  <BatteryBar level={info.battery.level} colors={colors} />
                ) : undefined
              }
            />
          ))}

        <Button
          label="Open Date Picker"
          icon="📅"
          onPress={() => navigation.navigate('DatePicker')}
          colors={colors}
          variant="primary"
          testID="open-date-picker"
        />
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
  hero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  batteryTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  error: {
    marginBottom: 12,
    fontSize: 14,
  },
  loading: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});
