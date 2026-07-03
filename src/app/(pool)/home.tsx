import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/auth/AuthContext';

export default function PoolHomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welkom, {user?.naam}</Text>
        <Text style={styles.subtitle}>Rol: zwembad</Text>

        <Link href="/(pool)/oproep-plaatsen" asChild>
          <PrimaryButton title="Oproep plaatsen" onPress={() => {}} />
        </Link>

        <Link href="/(pool)/oproepen" asChild>
          <PrimaryButton title="Mijn oproepen" onPress={() => {}} />
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
