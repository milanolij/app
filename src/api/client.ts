import { API_BASE_URL } from '@/constants/config';
import { getToken } from '@/auth/storage';

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, message: string | string[], error: string) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.statusCode = statusCode;
    this.error = error;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

interface ErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    // For FormData, fetch sets "multipart/form-data; boundary=..." itself --
    // setting it manually here would omit the boundary and break the upload.
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: options.method ?? 'GET',
      headers,
      body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Kan geen verbinding maken met de server. Controleer je internetverbinding.',
      'NetworkError',
    );
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorBody = (data ?? {}) as ErrorBody;
    throw new ApiError(
      errorBody.statusCode ?? response.status,
      errorBody.message ?? 'Er is een onverwachte fout opgetreden',
      errorBody.error ?? response.statusText,
    );
  }

  return data as T;
}
