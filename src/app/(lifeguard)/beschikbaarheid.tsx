import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyLifeguardProfile, updateMyLifeguardProfile } from '@/api/lifeguardProfile';
import { ApiError } from '@/api/client';
import type { LifeguardProfile, UpdateAvailabilityPayload, Weekday } from '@/api/types';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'ma', label: 'Maandag' },
  { key: 'di', label: 'Dinsdag' },
  { key: 'wo', label: 'Woensdag' },
  { key: 'do', label: 'Donderdag' },
  { key: 'vr', label: 'Vrijdag' },
  { key: 'za', label: 'Zaterdag' },
  { key: 'zo', label: 'Zondag' },
];

export default function BeschikbaarheidScreen() {
  const queryClient = useQueryClient();
  const {
    data: profile,
    isLoading,
    error: loadError,
  } = useQuery<LifeguardProfile, ApiError>({
    queryKey: ['lifeguard-profile'],
    queryFn: getMyLifeguardProfile,
  });

  const [actiestraal, setActiestraal] = useState(10);
  const [dagen, setDagen] = useState<Set<Weekday>>(new Set());
  const [savedMessage, setSavedMessage] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setActiestraal(profile.actiestraal_km);
      setDagen(new Set(profile.beschikbare_dagen));
      initialized.current = true;
    }
  }, [profile]);

  const saveMutation = useMutation<LifeguardProfile, ApiError, UpdateAvailabilityPayload>({
    mutationFn: updateMyLifeguardProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['lifeguard-profile'], updated);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    },
  });

  const toggleDag = (dag: Weekday) => {
    setDagen((prev) => {
      const next = new Set(prev);
      if (next.has(dag)) {
        next.delete(dag);
      } else {
        next.add(dag);
      }
      return next;
    });
  };

  const handleSave = () => {
    setSavedMessage(false);
    saveMutation.mutate({
      actiestraal_km: Math.round(actiestraal),
      beschikbare_dagen: Array.from(dagen),
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Link href="/(lifeguard)/home" style={styles.backLink}>
          <Text style={styles.backLinkText}>Terug</Text>
        </Link>
        <Text style={styles.title}>Beschikbaarheid</Text>

        <ErrorBanner error={loadError ?? saveMutation.error} />
        {savedMessage && <Text style={styles.savedText}>Opgeslagen</Text>}

        <Text style={styles.sectionTitle}>Actiestraal: {Math.round(actiestraal)} km</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={actiestraal}
          onValueChange={setActiestraal}
          minimumTrackTintColor="#0f766e"
          maximumTrackTintColor="#cbd5e1"
          thumbTintColor="#0f766e"
        />

        <Text style={styles.sectionTitle}>Beschikbare dagen</Text>
        {WEEKDAYS.map((dag) => (
          <View key={dag.key} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{dag.label}</Text>
            <Switch
              value={dagen.has(dag.key)}
              onValueChange={() => toggleDag(dag.key)}
              trackColor={{ false: '#cbd5e1', true: '#0f766e' }}
            />
          </View>
        ))}

        <PrimaryButton title="Opslaan" onPress={handleSave} loading={saveMutation.isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
  },
  savedText: {
    color: '#1a7f37',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayLabel: {
    fontSize: 15,
    color: '#0f172a',
  },
});
