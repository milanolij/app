import { apiRequest } from '@/api/client';

export function registerPushToken(token: string, platform?: 'ios' | 'android'): Promise<void> {
  return apiRequest('/users/me/push-token', { method: 'POST', auth: true, body: { token, platform } });
}

export function unregisterPushToken(token: string): Promise<void> {
  return apiRequest('/users/me/push-token', { method: 'DELETE', auth: true, body: { token } });
}
