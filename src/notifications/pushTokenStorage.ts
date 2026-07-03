import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'reddersnet_push_token';
const isWeb = Platform.OS === 'web';

export async function getStoredPushToken(): Promise<string | null> {
  if (isWeb) {
    return window.localStorage.getItem(PUSH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(PUSH_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(PUSH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
