import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ThemeColors } from '../theme/colors';

type Props = {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  colors: ThemeColors;
  variant?: 'primary' | 'secondary';
  testID?: string;
};

export default function Button({
  label,
  icon,
  onPress,
  disabled,
  loading,
  colors,
  variant = 'secondary',
  testID,
}: Props) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : colors.card,
          borderColor: colors.border,
          borderWidth: isPrimary ? 0 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.7 : isDisabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text
            style={[
              styles.label,
              { color: isPrimary ? '#FFFFFF' : colors.text },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
