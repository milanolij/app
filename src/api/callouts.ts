import { apiRequest } from '@/api/client';
import type {
  CallOut,
  CallOutConfirmation,
  CallOutPoolView,
  CreateCallOutPayload,
  OpenCallOut,
} from '@/api/types';

export function listOpenCallOutsForMe(): Promise<OpenCallOut[]> {
  return apiRequest<OpenCallOut[]>('/callouts/me', { auth: true });
}

export function acceptCallOut(id: string): Promise<CallOut> {
  return apiRequest<CallOut>(`/callouts/${id}/accept`, { method: 'POST', auth: true });
}

export function declineCallOut(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/callouts/${id}/decline`, { method: 'POST', auth: true });
}

export function getCallOutConfirmation(id: string): Promise<CallOutConfirmation> {
  return apiRequest<CallOutConfirmation>(`/callouts/${id}`, { auth: true });
}

export function cancelCallOut(id: string): Promise<CallOut> {
  return apiRequest<CallOut>(`/callouts/${id}/cancel`, { method: 'POST', auth: true });
}

export function createCallOut(
  payload: CreateCallOutPayload,
): Promise<CallOut & { redders_uitgenodigd: number }> {
  return apiRequest<CallOut & { redders_uitgenodigd: number }>('/callouts', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function getCallOutPoolView(id: string): Promise<CallOutPoolView> {
  return apiRequest<CallOutPoolView>(`/callouts/${id}`, { auth: true });
}
