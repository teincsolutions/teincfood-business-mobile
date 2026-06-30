import axios from 'axios';
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
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns UploadResult with key (store) and download_url (preview)
 */
export async function uploadImage(
  localUri: string,
  domain: string = 'menus',
  context?: UploadContext,
  onProgress?: (percent: number) => void,
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

  const { data } = await api.post<UploadResponse>('/upload', body);

  const { upload_url, download_url, key } = data;
  console.log('[Upload] Got URLs', { key });

  // Read local file as blob
  const fileResp = await fetch(localUri);
  const blob = await fileResp.blob();
  const totalSize = blob.size;

  // Upload to S3 via axios (clean instance — no auth interceptor to break presigned URL)
  await axios.put(upload_url, blob, {
    headers: { 'Content-Type': contentType },
    timeout: 30000,
    onUploadProgress: (e) => {
      if (onProgress && totalSize > 0) {
        onProgress(Math.round((e.loaded * 100) / totalSize));
      }
    },
  });

  console.log('[Upload] S3 PUT succeeded');

  return { key, download_url };
}
