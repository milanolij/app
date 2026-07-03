import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reddersnet</Text>
        <Text style={styles.subtitle}>
          Het oproepnetwerk voor gecertificeerde zwembadredders in Vlaanderen.
        </Text>

        <View style={styles.actions}>
          <Link href="/register-lifeguard" asChild>
            <PrimaryButton title="Ik ben een redder" onPress={() => {}} />
          </Link>
          <Link href="/register-pool" asChild>
            <PrimaryButton title="Ik heb een zwembad" onPress={() => {}} variant="secondary" />
          </Link>
        </View>

        <Link href="/login" style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Al een account? Log in</Text>
        </Link>
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
    fontSize: 32,
    fontWeight: '700',
    color: '#0f766e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40,
  },
  actions: {
    gap: 4,
  },
  loginLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  loginLinkText: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '600',
  },
});
