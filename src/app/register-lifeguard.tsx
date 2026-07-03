import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function RegisterLifeguardScreen() {
  const { registerLifeguard } = useAuth();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [naam, setNaam] = useState('');
  const [telefoon, setTelefoon] = useState('');
  const [woonplaats, setWoonplaats] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await registerLifeguard({ email, wachtwoord, naam, telefoon, woonplaats });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Onbekende fout', 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Registreren als redder</Text>

        <ErrorBanner error={error} />

        <FormField
          label="E-mailadres"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField
          label="Wachtwoord (minimaal 8 tekens)"
          value={wachtwoord}
          onChangeText={setWachtwoord}
          secureTextEntry
          autoCapitalize="none"
        />
        <FormField label="Naam" value={naam} onChangeText={setNaam} autoComplete="name" />
        <FormField
          label="Telefoon"
          value={telefoon}
          onChangeText={setTelefoon}
          keyboardType="phone-pad"
        />
        <FormField label="Woonplaats" value={woonplaats} onChangeText={setWoonplaats} />

        <PrimaryButton title="Registreren" onPress={handleSubmit} loading={loading} />

        <Link href="/login" style={styles.link}>
          <Text style={styles.linkText}>Al een account? Log in</Text>
        </Link>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Terug</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  link: {
    marginTop: 12,
    alignSelf: 'center',
  },
  linkText: {
    color: '#0f766e',
    fontSize: 14,
  },
});
