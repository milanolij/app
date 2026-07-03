import { apiRequest } from '@/api/client';
import type { LifeguardProfile, UpdateAvailabilityPayload } from '@/api/types';

export function getMyLifeguardProfile(): Promise<LifeguardProfile> {
  return apiRequest<LifeguardProfile>('/users/me/lifeguard-profile', { auth: true });
}

export function updateMyLifeguardProfile(
  payload: UpdateAvailabilityPayload,
): Promise<LifeguardProfile> {
  return apiRequest<LifeguardProfile>('/users/me/lifeguard-profile', {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}
