import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancelCallOut, getCallOutConfirmation } from '@/api/callouts';
import { ApiError } from '@/api/client';
import type { CallOut, CallOutConfirmation } from '@/api/types';
import {
  CALLOUT_STATUS_COLORS,
  CALLOUT_STATUS_LABELS,
  REDEN_COLORS,
  REDEN_LABELS,
  formatOproepPeriode,
} from '@/callouts/display';
import { clearAcceptedCallout, getAcceptedCallout } from '@/callouts/storage';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function BevestigingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: confirmation,
    isLoading,
    error,
    refetch,
  } = useQuery<CallOutConfirmation, ApiError>({
    queryKey: ['callout-confirmation', id],
    queryFn: () => getCallOutConfirmation(id),
    enabled: !!id,
    retry: false,
  });

  const isAccessError = error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404);
  const isNotFound = error instanceof ApiError && error.statusCode === 404;

  useEffect(() => {
    if (!isAccessError) {
      return;
    }
    (async () => {
      const stored = await getAcceptedCallout();
      if (stored?.id === id) {
        await clearAcceptedCallout();
      }
    })();
  }, [isAccessError, id]);

  const cancelMutation = useMutation<CallOut, ApiError, void>({
    mutationFn: () => cancelCallOut(id),
    onSuccess: async () => {
      await clearAcceptedCallout();
      queryClient.invalidateQueries({ queryKey: ['callouts-me'] });
      queryClient.invalidateQueries({ queryKey: ['accepted-callout'] });
      router.replace('/(lifeguard)/home');
    },
  });

  function onCancelPress() {
    Alert.alert(
      'Oproep annuleren',
      'Weet je zeker dat je deze bevestigde shift wilt annuleren? De oproep wordt opnieuw opengesteld voor andere redders.',
      [
        { text: 'Nee', style: 'cancel' },
        { text: 'Ja, annuleren', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    );
  }

  if (isAccessError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{isNotFound ? 'Oproep niet gevonden' : 'Niet (meer) geaccepteerd'}</Text>
          <Text style={styles.subtitle}>{error?.message}</Text>
          <Link href="/(lifeguard)/home" asChild>
            <PrimaryButton title="Naar home" onPress={() => {}} />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const redenColor = confirmation ? REDEN_COLORS[confirmation.reden] : null;
  const statusColor = confirmation ? CALLOUT_STATUS_COLORS[confirmation.status] : null;
  const genericError = !isAccessError ? error : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Link href="/(lifeguard)/home" style={styles.backLink}>
          <Text style={styles.backLinkText}>Terug</Text>
        </Link>
        <Text style={styles.title}>Bevestiging</Text>

        <ErrorBanner error={genericError ?? cancelMutation.error} />
        {genericError && (
          <PrimaryButton title="Opnieuw proberen" variant="secondary" onPress={() => refetch()} />
        )}
        {isLoading && <Text style={styles.loadingText}>Gegevens laden...</Text>}

        {confirmation && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.rowTitle}>{confirmation.zwembad}</Text>
              {statusColor && (
                <View style={[styles.badge, { backgroundColor: statusColor.background }]}>
                  <Text style={[styles.badgeText, { color: statusColor.text }]}>
                    {CALLOUT_STATUS_LABELS[confirmation.status]}
                  </Text>
                </View>
              )}
            </View>

            {redenColor && (
              <View style={[styles.badge, styles.redenBadge, { backgroundColor: redenColor.background }]}>
                <Text style={[styles.badgeText, { color: redenColor.text }]}>
                  {REDEN_LABELS[confirmation.reden]}
                </Text>
              </View>
            )}

            <Text style={styles.rowSubtitle}>
              {formatOproepPeriode(confirmation.start_tijd, confirmation.eind_tijd)}
            </Text>

            <View style={styles.divider} />

            <DetailRow label="Adres" value={confirmation.adres} />
            <DetailRow label="Contactpersoon" value={confirmation.contactpersoon} />
            <DetailRow label="Telefoon" value={confirmation.telefoon} />
            <DetailRow
              label="Vergoeding"
              value={`€ ${Number(confirmation.vergoeding).toLocaleString('nl-NL', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />

            <View style={styles.actionsRow}>
              <PrimaryButton
                title="Oproep annuleren"
                variant="secondary"
                onPress={onCancelPress}
                loading={cancelMutation.isPending}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: '#0f766e',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
    marginRight: 8,
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  redenBadge: {
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  actionsRow: {
    marginTop: 16,
  },
});
