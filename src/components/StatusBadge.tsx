import { StyleSheet, Text, View } from 'react-native';

import type { WeergaveStatus } from '@/api/types';

const LABELS: Record<WeergaveStatus, string> = {
  geldig: 'Geldig',
  bijna_verlopen: 'Bijna verlopen',
  verlopen: 'Verlopen',
  afgekeurd: 'Afgekeurd',
  in_behandeling: 'In behandeling',
};

// Same palette as the admin dashboard (public/dashboard/index.html) for a consistent product feel.
const COLORS: Record<WeergaveStatus, { background: string; text: string }> = {
  geldig: { background: '#dafbe1', text: '#1a7f37' },
  bijna_verlopen: { background: '#fff8c5', text: '#b08800' },
  verlopen: { background: '#ffebe9', text: '#cf222e' },
  afgekeurd: { background: '#ffebe9', text: '#cf222e' },
  in_behandeling: { background: '#eaeef2', text: '#6e7781' },
};

interface StatusBadgeProps {
  status: WeergaveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
