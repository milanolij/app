import { apiRequest } from '@/api/client';
import type {
  LoginPayload,
  LoginResponse,
  RegisterLifeguardPayload,
  RegisterPoolPayload,
  SafeUser,
} from '@/api/types';

export const registerLifeguard = (payload: RegisterLifeguardPayload) =>
  apiRequest<SafeUser>('/auth/register/lifeguard', { method: 'POST', body: payload });

export const registerPool = (payload: RegisterPoolPayload) =>
  apiRequest<SafeUser>('/auth/register/pool', { method: 'POST', body: payload });

export const login = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: payload });

export const getMe = () => apiRequest<SafeUser>('/users/me', { auth: true });
