import React, { useCallback, useEffect, useState } from 'react';
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

type Row = { label: string; value: string };

function Card({
  title,
  rows,
  isDarkMode,
}: {
  title: string;
  rows: Row[];
  isDarkMode: boolean;
}) {
  return (
    <View
      style={[styles.card, isDarkMode ? styles.cardDark : styles.cardLight]}
    >
      <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>
        {title}
      </Text>
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.rowLabel, isDarkMode && styles.textDarkMuted]}>
            {row.label}
          </Text>
          <Text style={[styles.rowValue, isDarkMode && styles.textDark]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const buildCards = (
  info: NativeDeviceInfoResult,
): { title: string; rows: Row[] }[] => {
  return [
    {
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
      title: 'Battery & Storage',
      rows: [
        { label: 'Battery level', value: formatPercent(info.battery.level) },
        { label: 'Charging', value: info.battery.isCharging ? 'Yes' : 'No' },
        {
          label: 'Total storage',
          value: formatBytes(info.storage.totalStorage),
        },
        { label: 'Free storage', value: formatBytes(info.storage.freeStorage) },
      ],
    },
    {
      title: 'Network',
      rows: [
        { label: 'Connection', value: info.network.connectionType },
        { label: 'IP address', value: info.network.ipAddress || 'Unknown' },
        { label: 'Carrier', value: info.network.carrierName || 'Unavailable' },
      ],
    },
    {
      title: 'App & Identifiers',
      rows: [
        { label: 'App version', value: info.app.appVersion },
        { label: 'Build number', value: info.app.buildNumber },
        { label: 'Bundle ID', value: info.app.bundleId },
        { label: 'Device ID', value: info.app.deviceId },
      ],
    },
  ];
};

export default function DeviceInfoScreen() {
  const isDarkMode = useColorScheme() === 'dark';
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView
      style={isDarkMode ? styles.screenDark : styles.screenLight}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.title, isDarkMode && styles.textDark]}>
          Device Info
        </Text>
        {error && (
          <Text style={styles.error} testID="device-info-error">
            {error}
          </Text>
        )}
        {!info && !error && (
          <Text
            style={[styles.rowValue, isDarkMode && styles.textDark]}
            testID="device-info-loading"
          >
            Loading…
          </Text>
        )}
        {info &&
          buildCards(info).map(card => (
            <Card
              key={card.title}
              title={card.title}
              rows={card.rows}
              isDarkMode={isDarkMode}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenLight: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  screenDark: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 14,
    color: '#6E6E73',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 12,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textDarkMuted: {
    color: '#98989D',
  },
});
