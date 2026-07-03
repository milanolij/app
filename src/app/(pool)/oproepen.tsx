import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { REDEN_COLORS, REDEN_LABELS, formatOproepPeriode } from '@/callouts/display';
import { listPlacedCallouts, PlacedCallout } from '@/callouts/poolStorage';

export default function PoolOproepenScreen() {
  const {
    data: callouts,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<PlacedCallout[]>({
    queryKey: ['placed-callouts'],
    queryFn: listPlacedCallouts,
  });

  const sorted = [...(callouts ?? [])].sort(
    (a, b) => new Date(a.start_tijd).getTime() - new Date(b.start_tijd).getTime(),
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OproepRow callout={item} />}
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
            <Link href="/(pool)/home" style={styles.backLink}>
              <Text style={styles.backLinkText}>Terug</Text>
            </Link>
            <Text style={styles.title}>Mijn oproepen</Text>
            {isLoading && <Text style={styles.loadingText}>Oproepen laden...</Text>}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? <Text style={styles.emptyText}>Nog geen oproepen geplaatst.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

function OproepRow({ callout }: { callout: PlacedCallout }) {
  const redenColor = REDEN_COLORS[callout.reden];

  return (
    <Link href={{ pathname: '/(pool)/oproep-status/[id]', params: { id: callout.id } }} asChild>
      <Pressable style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <View style={[styles.badge, { backgroundColor: redenColor.background }]}>
            <Text style={[styles.badgeText, { color: redenColor.text }]}>{REDEN_LABELS[callout.reden]}</Text>
          </View>
          <Text style={styles.rowVergoeding}>€ {Number(callout.vergoeding).toFixed(2)}</Text>
        </View>
        <Text style={styles.rowSubtitle}>{formatOproepPeriode(callout.start_tijd, callout.eind_tijd)}</Text>
      </Pressable>
    </Link>
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
  rowContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowVergoeding: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
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
});
