import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { acceptCallOut, declineCallOut, listOpenCallOutsForMe } from '@/api/callouts';
import { ApiError } from '@/api/client';
import type { BrevetType, CallOut, OpenCallOut } from '@/api/types';
import { REDEN_COLORS, REDEN_LABELS, formatOproepPeriode } from '@/callouts/display';
import { setAcceptedCallout } from '@/callouts/storage';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';

const BREVET_TYPE_LABELS: Record<BrevetType, string> = {
  hoger_redder: 'Hoger Redder',
  basisredder: 'Basisredder',
};

export default function OproepenScreen() {
  const queryClient = useQueryClient();
  const {
    data: callouts,
    isLoading,
    isRefetching,
    refetch,
    error: loadError,
  } = useQuery<OpenCallOut[], ApiError>({
    queryKey: ['callouts-me'],
    queryFn: listOpenCallOutsForMe,
  });

  const acceptMutation = useMutation<CallOut, ApiError, string>({
    mutationFn: acceptCallOut,
    onSuccess: async (callOut) => {
      await setAcceptedCallout({ id: callOut.id, eind_tijd: callOut.eind_tijd });
      router.push({ pathname: '/(lifeguard)/bevestiging/[id]', params: { id: callOut.id } });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['callouts-me'] }),
  });

  const declineMutation = useMutation<{ message: string }, ApiError, string>({
    mutationFn: declineCallOut,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['callouts-me'] }),
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={callouts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CallOutRow
            item={item}
            onAccept={(id) => acceptMutation.mutate(id)}
            onDecline={(id) => declineMutation.mutate(id)}
            isAccepting={acceptMutation.isPending && acceptMutation.variables === item.id}
            isDeclining={declineMutation.isPending && declineMutation.variables === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#0f766e"
            colors={['#0f766e']}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Link href="/(lifeguard)/home" style={styles.backLink}>
              <Text style={styles.backLinkText}>Terug</Text>
            </Link>
            <Text style={styles.title}>Oproepen</Text>
            <ErrorBanner error={loadError ?? acceptMutation.error ?? declineMutation.error} />
            {isLoading && <Text style={styles.loadingText}>Oproepen laden...</Text>}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>Geen open oproepen binnen je actiestraal.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function CallOutRow({
  item,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  item: OpenCallOut;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}) {
  const busy = isAccepting || isDeclining;
  const redenColor = REDEN_COLORS[item.reden];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.rowTitle}>{item.zwembad}</Text>
        <View style={[styles.badge, { backgroundColor: redenColor.background }]}>
          <Text style={[styles.badgeText, { color: redenColor.text }]}>{REDEN_LABELS[item.reden]}</Text>
        </View>
      </View>
      <Text style={styles.rowSubtitle}>
        {item.afstand_km} km · {BREVET_TYPE_LABELS[item.vereist_brevet_type]}
      </Text>
      <Text style={styles.rowSubtitle}>{formatOproepPeriode(item.start_tijd, item.eind_tijd)}</Text>

      <View style={styles.actionsRow}>
        <View style={styles.actionButton}>
          <PrimaryButton
            title="Weigeren"
            variant="secondary"
            onPress={() => onDecline(item.id)}
            loading={isDeclining}
            disabled={busy}
          />
        </View>
        <View style={styles.actionButton}>
          <PrimaryButton
            title="Accepteren"
            onPress={() => onAccept(item.id)}
            loading={isAccepting}
            disabled={busy}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 8,
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
    marginBottom: 20,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowTitle: {
    fontSize: 15,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
  },
});
