import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { ApiError } from '@/api/client';
import {
  getMe,
  login as apiLogin,
  registerLifeguard as apiRegisterLifeguard,
  registerPool as apiRegisterPool,
} from '@/api/auth';
import { unregisterPushToken } from '@/api/pushTokens';
import type { LoginPayload, RegisterLifeguardPayload, RegisterPoolPayload, SafeUser } from '@/api/types';
import { deleteToken, getToken, setToken } from '@/auth/storage';
import { clearStoredPushToken, getStoredPushToken } from '@/notifications/pushTokenStorage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'hydrationError';

interface AuthContextValue {
  status: AuthStatus;
  user: SafeUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  registerLifeguard: (payload: RegisterLifeguardPayload) => Promise<void>;
  registerPool: (payload: RegisterPoolPayload) => Promise<void>;
  logout: () => Promise<void>;
  retryHydration: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SafeUser | null>(null);

  const hydrate = useCallback(() => {
    setStatus('loading');
    (async () => {
      const token = await getToken();
      if (!token) {
        setStatus('signedOut');
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
        setStatus('signedIn');
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          await deleteToken();
          setUser(null);
          setStatus('signedOut');
        } else {
          // Network/other failure: the token might still be valid, the network is just
          // down. Never force a logout here -- surface a retry affordance instead.
          setStatus('hydrationError');
        }
      }
    })();
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await apiLogin(payload);
    await setToken(result.access_token);
    setUser(result.user);
    setStatus('signedIn');
  }, []);

  const registerLifeguard = useCallback(
    async (payload: RegisterLifeguardPayload) => {
      await apiRegisterLifeguard(payload);
      await login({ email: payload.email, wachtwoord: payload.wachtwoord });
    },
    [login],
  );

  const registerPool = useCallback(
    async (payload: RegisterPoolPayload) => {
      await apiRegisterPool(payload);
      await login({ email: payload.email, wachtwoord: payload.wachtwoord });
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      const storedToken = await getStoredPushToken();
      if (storedToken) {
        await unregisterPushToken(storedToken);
      }
    } catch {
      // Best-effort: a network hiccup here should never block logout.
    }
    await clearStoredPushToken();
    await deleteToken();
    setUser(null);
    setStatus('signedOut');
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, login, registerLifeguard, registerPool, logout, retryHydration: hydrate }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
