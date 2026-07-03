import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCallOutPoolView } from '@/api/callouts';
import { ApiError } from '@/api/client';
import type { BrevetType, CallOutPoolView } from '@/api/types';
import {
  CALLOUT_STATUS_COLORS,
  CALLOUT_STATUS_LABELS,
  REDEN_COLORS,
  REDEN_LABELS,
  formatOproepPeriode,
} from '@/callouts/display';
import { getPlacedCallout, PlacedCallout } from '@/callouts/poolStorage';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';

const BREVET_TYPE_LABELS: Record<BrevetType, string> = {
  hoger_redder: 'Hoger Redder',
  basisredder: 'Basisredder',
};

export default function OproepStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cached, setCached] = useState<PlacedCallout | null>(null);

  useEffect(() => {
    if (id) {
      getPlacedCallout(id).then(setCached);
    }
  }, [id]);

  const {
    data: live,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<CallOutPoolView, ApiError>({
    queryKey: ['callout-pool-view', id],
    queryFn: () => getCallOutPoolView(id),
    enabled: !!id,
  });

  const reden = live?.reden ?? cached?.reden;
  const startTijd = live?.start_tijd ?? cached?.start_tijd;
  const eindTijd = live?.eind_tijd ?? cached?.eind_tijd;
  const vergoeding = live?.vergoeding ?? cached?.vergoeding;
  const status = live?.status;

  const redenColor = reden ? REDEN_COLORS[reden] : null;
  const statusColor = status ? CALLOUT_STATUS_COLORS[status] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Link href="/(pool)/home" style={styles.backLink}>
          <Text style={styles.backLinkText}>Terug</Text>
        </Link>
        <Text style={styles.title}>Oproepstatus</Text>

        <ErrorBanner error={error} />
        {error && (
          <PrimaryButton title="Opnieuw proberen" variant="secondary" onPress={() => refetch()} />
        )}
        {isLoading && <Text style={styles.loadingText}>Gegevens laden...</Text>}

        {reden && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.rowTitle}>{REDEN_LABELS[reden]}</Text>
              {statusColor && status && (
                <View style={[styles.badge, { backgroundColor: statusColor.background }]}>
                  <Text style={[styles.badgeText, { color: statusColor.text }]}>
                    {CALLOUT_STATUS_LABELS[status]}
                  </Text>
                </View>
              )}
            </View>

            {redenColor && startTijd && eindTijd && (
              <Text style={styles.rowSubtitle}>{formatOproepPeriode(startTijd, eindTijd)}</Text>
            )}

            <View style={styles.divider} />

            {cached && (
              <>
                <DetailRow label="Aantal redders benodigd" value={String(cached.aantal_redders_nodig)} />
                <DetailRow label="Vereist brevet" value={BREVET_TYPE_LABELS[cached.vereist_brevet_type]} />
              </>
            )}
            {vergoeding && (
              <DetailRow
                label="Vergoeding"
                value={`€ ${Number(vergoeding).toLocaleString('nl-NL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              />
            )}

            <View style={styles.divider} />

            {live?.redder ? (
              <>
                <DetailRow label="Redder" value={live.redder.naam} />
                <DetailRow label="Telefoon" value={live.redder.telefoon} />
              </>
            ) : (
              <Text style={styles.emptyText}>Nog niet ingevuld door een redder.</Text>
            )}

            <View style={styles.actionsRow}>
              <PrimaryButton
                title="Verversen"
                variant="secondary"
                onPress={() => refetch()}
                loading={isRefetching}
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
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  actionsRow: {
    marginTop: 16,
  },
});
