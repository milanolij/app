import type { CallOutReason, CallOutStatus } from '@/api/types';

export const REDEN_LABELS: Record<CallOutReason, string> = {
  tekort: 'Personeelstekort',
  ziekte: 'Ziekte',
  drukte: 'Drukte',
  anders: 'Anders',
};

export const REDEN_COLORS: Record<CallOutReason, { background: string; text: string }> = {
  tekort: { background: '#e0f2fe', text: '#075985' },
  ziekte: { background: '#fef3c7', text: '#92400e' },
  drukte: { background: '#ede9fe', text: '#5b21b6' },
  anders: { background: '#eaeef2', text: '#6e7781' },
};

export const CALLOUT_STATUS_LABELS: Record<CallOutStatus, string> = {
  open: 'Open',
  bevestigd: 'Bevestigd',
  geannuleerd: 'Geannuleerd',
  verlopen: 'Verlopen',
};

export const CALLOUT_STATUS_COLORS: Record<CallOutStatus, { background: string; text: string }> = {
  open: { background: '#e0f2fe', text: '#075985' },
  bevestigd: { background: '#dafbe1', text: '#1a7f37' },
  geannuleerd: { background: '#ffebe9', text: '#cf222e' },
  verlopen: { background: '#eaeef2', text: '#6e7781' },
};

export function formatOproepPeriode(startIso: string, eindIso: string): string {
  const start = new Date(startIso);
  const eind = new Date(eindIso);
  const datum = start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  const startTijd = start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const eindTijd = eind.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `${datum}, ${startTijd}–${eindTijd}`;
}
