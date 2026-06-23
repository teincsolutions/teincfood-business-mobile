import { api } from './api';

interface UploadResponse {
  data: {
    upload_url: string;
    key: string;
    bucket: string;
  };
}

export async function uploadImage(localUri: string): Promise<string> {
  const filename = localUri.split('/').pop() || 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType =
    ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg';

  const { data } = await api.post<UploadResponse>('/upload', {
    filename,
    content_type: contentType,
    prefix: 'menu',
  });

  const { upload_url, key } = data;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const uploadResult = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResult.ok) {
    throw new Error('Failed to upload image to storage');
  }

  return key;
}
