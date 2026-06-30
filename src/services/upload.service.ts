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

const STORAGE_URL = process.env.EXPO_PUBLIC_STORAGE_URL || 'http://localhost:9000';

function replaceStorageHost(url: string): string {
  try {
    const u = new URL(url);
    const storage = new URL(STORAGE_URL);
    // Replace host + port with configured storage endpoint
    u.host = storage.host;
    u.port = storage.port;
    u.protocol = storage.protocol;
    return u.toString();
  } catch {
    return url;
  }
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
  // Replace localhost in the presigned URL with the configured storage endpoint
  const resolvedUploadUrl = replaceStorageHost(upload_url);
  console.log('[Upload] Got URLs', { key, resolved: resolvedUploadUrl?.slice(0, 120) });

  // Upload to S3 via fetch (works in RN for binary PUT to presigned URLs)
  console.log('[Upload] Uploading file');
  const fileResp = await fetch(localUri);
  const blob = await fileResp.blob();

  const uploadResult = await fetch(resolvedUploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResult.ok) {
    const errText = await uploadResult.text().catch(() => '');
    throw new Error(`Upload failed (${uploadResult.status}): ${errText}`);
  }

  console.log('[Upload] S3 PUT succeeded');

  return { key, download_url };
}
