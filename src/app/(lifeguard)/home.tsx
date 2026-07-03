import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { clearAcceptedCallout, getAcceptedCallout } from '@/callouts/storage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/auth/AuthContext';

export default function LifeguardHomeScreen() {
  const { user, logout } = useAuth();

  const { data: acceptedCallout } = useQuery({
    queryKey: ['accepted-callout'],
    queryFn: async () => {
      const stored = await getAcceptedCallout();
      if (!stored) {
        return null;
      }
      if (new Date(stored.eind_tijd).getTime() <= Date.now()) {
        await clearAcceptedCallout();
        return null;
      }
      return stored;
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welkom, {user?.naam}</Text>
        <Text style={styles.subtitle}>Rol: redder</Text>

        {acceptedCallout && (
          <Link
            href={{ pathname: '/(lifeguard)/bevestiging/[id]', params: { id: acceptedCallout.id } }}
            asChild
          >
            <PrimaryButton title="Bevestigde shift" onPress={() => {}} />
          </Link>
        )}

        <Link href="/(lifeguard)/oproepen" asChild>
          <PrimaryButton title="Open oproepen" onPress={() => {}} />
        </Link>

        <Link href="/(lifeguard)/brevetten" asChild>
          <PrimaryButton title="Mijn brevetten" onPress={() => {}} />
        </Link>

        <Link href="/(lifeguard)/beschikbaarheid" asChild>
          <PrimaryButton title="Beschikbaarheid" onPress={() => {}} />
        </Link>

        <PrimaryButton title="Log uit" onPress={logout} variant="secondary" />
      </View>
    </SafeAreaView>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
  },
});
