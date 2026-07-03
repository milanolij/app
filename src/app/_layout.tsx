import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import '@/notifications/notificationHandler';
import { registerForPushNotifications } from '@/notifications/registerForPushNotifications';
import { getStoredPushToken, setStoredPushToken } from '@/notifications/pushTokenStorage';
import { registerPushToken } from '@/api/pushTokens';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { status, user, retryHydration } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistrationRan = useRef(false);

  useEffect(() => {
    if (status === 'loading' || status === 'hydrationError') {
      return;
    }

    SplashScreen.hideAsync();

    const inLifeguardArea = segments[0] === '(lifeguard)';
    const inPoolArea = segments[0] === '(pool)';

    if (status === 'signedOut' && (inLifeguardArea || inPoolArea)) {
      router.replace('/login');
      return;
    }

    if (status === 'signedIn' && user) {
      if (user.role === 'lifeguard' && !inLifeguardArea) {
        router.replace('/(lifeguard)/home');
      } else if (user.role === 'pool' && !inPoolArea) {
        router.replace('/(pool)/home');
      }
      // role === 'admin' has its own web dashboard, out of scope for the mobile app.
    }
  }, [status, user, segments, router]);

  useEffect(() => {
    if (status === 'signedOut') {
      pushRegistrationRan.current = false;
      return;
    }
    if (status !== 'signedIn' || pushRegistrationRan.current) {
      return;
    }
    pushRegistrationRan.current = true;

    (async () => {
      const token = await registerForPushNotifications();
      if (!token) {
        return;
      }
      const storedToken = await getStoredPushToken();
      if (storedToken === token) {
        return;
      }
      try {
        await registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
        await setStoredPushToken(token);
      } catch {
        // Best-effort: a failed registration simply means no push this session,
        // it will retry on the next sign-in/app start.
      }
    })();
  }, [status]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      if (user?.role === 'lifeguard') {
        router.push('/(lifeguard)/oproepen');
      } else if (user?.role === 'pool') {
        router.push('/(pool)/oproepen');
      }
    });
    return () => subscription.remove();
  }, [user, router]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (status === 'hydrationError') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Kan sessie niet controleren. Controleer je verbinding.</Text>
        <PrimaryButton title="Opnieuw proberen" onPress={retryHydration} />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
});
