export const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#6E6E73',
  border: '#E5E5EA',
  primary: '#007AFF',
  danger: '#FF3B30',
  success: '#34C759',
};

export const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textMuted: '#98989D',
  border: '#38383A',
  primary: '#0A84FF',
  danger: '#FF453A',
  success: '#30D158',
};

export type ThemeColors = typeof lightColors;

export function getThemeColors(isDarkMode: boolean): ThemeColors {
  return isDarkMode ? darkColors : lightColors;
}

// Shared elevation for cards: shadow* apply on iOS, elevation on Android.
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 2,
};
