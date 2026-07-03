import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { BrevetType, CallOutReason } from '@/api/types';

const PLACED_CALLOUTS_KEY = 'reddersnet_placed_callouts';
const isWeb = Platform.OS === 'web';

export interface PlacedCallout {
  id: string;
  reden: CallOutReason;
  aantal_redders_nodig: number;
  vereist_brevet_type: BrevetType;
  start_tijd: string;
  eind_tijd: string;
  vergoeding: string;
  aangemaakt_op: string;
}

async function readRaw(): Promise<string | null> {
  if (isWeb) {
    return window.localStorage.getItem(PLACED_CALLOUTS_KEY);
  }
  return SecureStore.getItemAsync(PLACED_CALLOUTS_KEY);
}

async function writeRaw(raw: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(PLACED_CALLOUTS_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(PLACED_CALLOUTS_KEY, raw);
}

export async function listPlacedCallouts(): Promise<PlacedCallout[]> {
  const raw = await readRaw();
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as PlacedCallout[];
  } catch {
    return [];
  }
}

export async function addPlacedCallout(entry: PlacedCallout): Promise<void> {
  const current = await listPlacedCallouts();
  await writeRaw(JSON.stringify([entry, ...current]));
}

export async function getPlacedCallout(id: string): Promise<PlacedCallout | null> {
  const current = await listPlacedCallouts();
  return current.find((c) => c.id === id) ?? null;
}
