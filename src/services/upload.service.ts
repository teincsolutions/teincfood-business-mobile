import { api } from './api';

interface UploadResponse {
  data: {
    upload_url: string;
    download_url: string;
    key: string;
    bucket: string;
  };
}

export interface UploadContext {
  business_id?: string;
  item_id?: string;
  entity_type?: string;
  entity_id?: string;
  document_type?: string;
  user_id?: string;
  subdomain?: string;
}

export interface UploadResult {
  /** S3 key — store this as image_url on the menu item */
  key: string;
  /** Presigned download URL — use for instant preview (24h valid) */
  download_url: string;
}

/**
 * Upload an image to S3/MinIO via presigned URL.
 * @param localUri - Local file URI
 * @param domain - Storage domain (avatars, businesses, kyc, menus, chat)
 * @param context - Optional context with business_id, item_id
 * @returns UploadResult with key (store) and download_url (preview)
 */
export async function uploadImage(
  localUri: string,
  domain: string = 'menus',
  context?: UploadContext,
): Promise<UploadResult> {
  const filename = localUri.split('/').pop() || 'image.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType =
    ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg';

  const body: Record<string, any> = {
    domain,
    filename,
    content_type: contentType,
  };
  if (context) {
    body.context = context;
  }

  console.log('[Upload] Requesting presigned URL', { domain, filename, contentType });

  const { data } = await api.post<UploadResponse>('/upload', body);

  const { upload_url, download_url, key } = data;
  console.log('[Upload] Got URLs', { key, download_url: download_url?.slice(0, 80) });

  console.log('[Upload] Fetching blob from', localUri?.slice(0, 80));
  const response = await fetch(localUri);
  const blob = await response.blob();
  console.log('[Upload] Blob size', blob.size, 'type', blob.type);

  const uploadResult = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResult.ok) {
    const errorText = await uploadResult.text().catch(() => 'no body');
    console.error('[Upload] S3 PUT failed', { status: uploadResult.status, statusText: uploadResult.statusText, body: errorText });
    throw new Error(`Failed to upload image to storage (${uploadResult.status})`);
  }

  console.log('[Upload] S3 PUT succeeded');

  return { key, download_url };
}
