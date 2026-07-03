import { apiRequest } from '@/api/client';
import type { Brevet, BrevetType } from '@/api/types';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  /** Set only on web, where expo-document-picker returns a real File/Blob. */
  webFile?: File;
}

export interface UploadBrevetPayload {
  type: BrevetType;
  vervaldatum: string;
  file: PickedFile;
}

export function uploadBrevet(payload: UploadBrevetPayload): Promise<Brevet> {
  const formData = new FormData();
  formData.append('type', payload.type);
  formData.append('vervaldatum', payload.vervaldatum);

  if (payload.file.webFile) {
    formData.append('bestand', payload.file.webFile, payload.file.name);
  } else {
    // React Native's fetch/FormData accepts this object shape for file uploads.
    formData.append(
      'bestand',
      {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.mimeType,
      } as unknown as Blob,
    );
  }

  return apiRequest<Brevet>('/brevetten', { method: 'POST', auth: true, body: formData });
}

export function listMyBrevetten(): Promise<Brevet[]> {
  return apiRequest<Brevet[]>('/brevetten/me', { auth: true });
}
