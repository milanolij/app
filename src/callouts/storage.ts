import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCEPTED_CALLOUT_KEY = 'reddersnet_accepted_callout';
const isWeb = Platform.OS === 'web';

export interface AcceptedCallout {
  id: string;
  eind_tijd: string;
}

export async function getAcceptedCallout(): Promise<AcceptedCallout | null> {
  const raw = isWeb
    ? window.localStorage.getItem(ACCEPTED_CALLOUT_KEY)
    : await SecureStore.getItemAsync(ACCEPTED_CALLOUT_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AcceptedCallout;
  } catch {
    return null;
  }
}

export async function setAcceptedCallout(value: AcceptedCallout): Promise<void> {
  const raw = JSON.stringify(value);
  if (isWeb) {
    window.localStorage.setItem(ACCEPTED_CALLOUT_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(ACCEPTED_CALLOUT_KEY, raw);
}

export async function clearAcceptedCallout(): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(ACCEPTED_CALLOUT_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCEPTED_CALLOUT_KEY);
}
