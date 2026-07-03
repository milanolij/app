import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';

interface ErrorBannerProps {
  error: ApiError | Error | null;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.text}>{error.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: '#b91c1c',
    fontSize: 14,
  },
});
