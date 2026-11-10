import {
  createUploadTask,
  FileSystemUploadType,
  copyAsync,
  getInfoAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';
import {
  applyMenuCommandLocal,
  emitReferenceChanged,
  ensureImageCacheDir,
  generateUUID,
  getCachedImagePath,
  getReferenceData,
  localNodeService,
  openSyncDatabase,
  runOfflineCapableMutation,
} from '@teincfood/core';
import type { MenuItem } from '@teincfood/core';
import { api } from './api';
import { updateMenuItem as updateMenuItemService } from './menu.service';
import { accountStorage } from '@/utils/storage';
import { useAuthStore } from '@/stores/auth.store';
import { useConnectivityStore } from '@/stores/connectivity.store';

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
  /** True when the image is cached locally and queued for upload. */
  pending?: boolean;
}

const PENDING_IMAGE_HOST = 'pending.teincfood.local';
const PENDING_UPLOADS_KEY = 'teincfood.pendingImageUploads.v1';
const PENDING_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

interface PendingImageItem {
  id: string;
  cacheRecord: MenuItem;
}

interface PendingImageUpload {
  id: string;
  businessId: string;
  domain: string;
  filename: string;
  contentType: string;
  context?: UploadContext;
  pendingUrl: string;
  localUri: string;
  createdAt: string;
  key?: string;
  downloadUrl?: string;
  items: PendingImageItem[];
  lastError?: string;
}

function contentTypeFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return ext === 'png'
    ? 'image/png'
    : ext === 'webp'
      ? 'image/webp'
      : ext === 'gif'
        ? 'image/gif'
        : 'image/jpeg';
}

export function isPendingImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).host === PENDING_IMAGE_HOST;
  } catch {
    return false;
  }
}

function pendingImageUrl(businessId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `https://${PENDING_IMAGE_HOST}/${businessId || 'unscoped'}/${generateUUID()}.${ext}`;
}

function loadQueue(): PendingImageUpload[] {
  // Pending menu uploads contain business/menu data. Scope the queue so a new
  // account never flushes or displays the previous user's images.
  const raw = accountStorage.getString(PENDING_UPLOADS_KEY);
  if (!raw) return [];
  let jobs: unknown;
  try {
    jobs = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(jobs)) return [];
  return jobs.filter(
    (job) =>
      !!job &&
      typeof job === 'object' &&
      typeof job.pendingUrl === 'string' &&
      typeof job.localUri === 'string',
  );
}

function saveQueue(jobs: PendingImageUpload[]): void {
  accountStorage.set(PENDING_UPLOADS_KEY, JSON.stringify(jobs));
}

/** Best-effort: push cached bytes to the Local Node for dark-LAN peers. */
async function mirrorAssetToNode(
  businessId: string,
  url: string,
  localUri: string,
): Promise<void> {
  if (!businessId || !url || !localUri) return;
  try {
    const info = await getInfoAsync(localUri);
    if (!info.exists || info.isDirectory) return;
    const base64 = await readAsStringAsync(localUri, { encoding: 'base64' });
    await localNodeService.putAsset(businessId, url, base64);
  } catch {
    // Not connected / not cached — the periodic retry will try again.
  }
}

/** Re-mirror every queued image, including jobs created before a node link. */
export async function mirrorPendingImageAssets(): Promise<void> {
  for (const job of loadQueue()) {
    if (!job.localUri) continue;
    await mirrorAssetToNode(job.businessId, job.pendingUrl, job.localUri);
    if (job.downloadUrl) {
      await mirrorAssetToNode(job.businessId, job.downloadUrl, job.localUri);
    }
  }
}

// Serialize queue mutations; uploads run outside the lock.
let queueLock: Promise<unknown> = Promise.resolve();
function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueLock.then(fn, fn);
  queueLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function remoteUpload(
  localUri: string,
  filename: string,
  contentType: string,
  context?: UploadContext,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const body: Record<string, unknown> = {
    domain: 'menus',
    filename,
    content_type: contentType,
  };
  if (context) body.context = context;

  const { data } = await api.post<UploadResponse>('/upload', body);
  const { upload_url, download_url, key } = data;
  if (!upload_url || !key) {
    throw new Error('Upload ticket failed: backend returned no upload_url/key');
  }

  const task = createUploadTask(
    upload_url,
    localUri,
    {
      httpMethod: 'PUT',
      headers: { 'Content-Type': contentType },
      uploadType: FileSystemUploadType.BINARY_CONTENT,
    },
    (progress) => {
      const percent = Math.round(
        (progress.totalBytesSent / Math.max(progress.totalBytesExpectedToSend, 1)) * 100,
      );
      onProgress?.(percent);
    },
  );

  const response = await task.uploadAsync();
  if (!response || response.status >= 400) {
    throw new Error(`Upload failed with status ${response?.status}`);
  }

  return { key, download_url };
}

async function queueLocalImage(
  localUri: string,
  context: UploadContext | undefined,
  filename: string,
  contentType: string,
): Promise<UploadResult> {
  const businessId = String(context?.business_id ?? '');
  const pendingUrl = pendingImageUrl(businessId, filename);

  await ensureImageCacheDir();
  const cachePath = getCachedImagePath(pendingUrl);
  await copyAsync({ from: localUri, to: cachePath });
  const info = await getInfoAsync(cachePath);
  if (!info.exists || info.isDirectory) {
    throw new Error('Upload cache failed: image could not be saved locally');
  }

  const job: PendingImageUpload = {
    id: generateUUID(),
    businessId,
    domain: 'menus',
    filename,
    contentType,
    context,
    pendingUrl,
    localUri: cachePath,
    createdAt: new Date().toISOString(),
    items: [],
  };
  await withQueueLock(async () => {
    const jobs = loadQueue();
    jobs.push(job);
    saveQueue(jobs);
  });

  void mirrorAssetToNode(businessId, pendingUrl, cachePath);
  return { key: pendingUrl, download_url: pendingUrl, pending: true };
}

/**
 * Upload an image. Menu images are local-first: the bytes are copied into the
 * durable image cache and queued, then synced to S3 in the background. Other
 * domains remain online-only.
 */
export async function uploadImage(
  localUri: string,
  domain: string = 'menus',
  context?: UploadContext,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const filename = localUri.split('/').pop() || 'image.jpg';
  const contentType = contentTypeFromName(filename);
  const offlineQueueAllowed = domain === 'menus';

  const token = useAuthStore.getState().accessToken;
  const connectivity = useConnectivityStore.getState();
  const cloudUsable =
    !!token && connectivity.isOnline && connectivity.isCloudReachable !== 'unreachable';

  // Local-first for menu images: cache the bytes and return the local preview
  // immediately. The S3 upload is background sync work, done now if possible
  // and retried later if not.
  if (offlineQueueAllowed) {
    const result = await queueLocalImage(localUri, context, filename, contentType);
    if (cloudUsable) void flushPendingImageUploads();
    return result;
  }

  if (!cloudUsable) {
    throw new Error('Upload requires an authenticated cloud connection');
  }

  return remoteUpload(localUri, filename, contentType, context, onProgress);
}

export async function bindPendingImageToItem(
  pendingUrl: string,
  businessId: string,
  itemId: string,
  cacheRecord: MenuItem,
): Promise<void> {
  if (!isPendingImageUrl(pendingUrl)) return;
  await withQueueLock(async () => {
    const jobs = loadQueue();
    const job = jobs.find(
      (entry) => entry.businessId === businessId && entry.pendingUrl === pendingUrl,
    );
    if (!job) return;
    const next: PendingImageItem = { id: itemId, cacheRecord };
    const index = job.items.findIndex((item) => item.id === itemId);
    if (index >= 0) job.items[index] = next;
    else job.items.push(next);
    saveQueue(jobs);
  });
}

export async function unbindPendingImageForItem(
  businessId: string,
  itemId: string,
): Promise<void> {
  await withQueueLock(async () => {
    const jobs = loadQueue();
    const next = jobs
      .map((job) =>
        job.businessId === businessId
          ? { ...job, items: job.items.filter((item) => item.id !== itemId) }
          : job,
      )
      .filter((job) => job.businessId !== businessId || job.items.length > 0);
    saveQueue(next);
  });
}

async function applyUploadedImage(
  job: PendingImageUpload,
  item: PendingImageItem,
): Promise<void> {
  if (!job.key || !job.downloadUrl) return;

  const db = await openSyncDatabase();
  const cached = await getReferenceData<{ data?: MenuItem[] }>(
    db,
    job.businessId,
    'menu:items',
  );
  const current = cached?.payload?.data?.find((record) => record.id === item.id);
  const snapshotUrl = item.cacheRecord.image_url ?? null;
  const currentUrl = current?.image_url ?? null;
  if (current) {
    const snapshotStamp = Date.parse(item.cacheRecord.updated_at) || 0;
    const currentStamp = Date.parse(current.updated_at) || 0;
    const superseded =
      currentUrl !== snapshotUrl &&
      currentUrl !== job.downloadUrl &&
      currentStamp > snapshotStamp;
    if (superseded) return;
  }

  const cacheRecord: MenuItem = {
    ...(current ?? item.cacheRecord),
    image_url: job.downloadUrl,
  };
  const payload = {
    id: item.id,
    image_url: job.key,
    cacheRecord,
  };

  await applyMenuCommandLocal(job.businessId, {
    command_type: 'menu:update_item',
    entity_id: item.id,
    command_id: `image-upload-${job.id}-${item.id}`,
    timestamp: new Date().toISOString(),
    payload,
  });
  emitReferenceChanged(job.businessId, ['menu:items']);

  await runOfflineCapableMutation({
    run: () => updateMenuItemService(item.id, { image_url: job.key }),
    commandType: 'menu:update_item',
    businessId: job.businessId,
    entityId: item.id,
    payload,
  });
}

async function doFlushPendingImageUploads(): Promise<{
  uploaded: number;
  remaining: number;
}> {
  const jobs = await withQueueLock(async () => loadQueue());
  if (jobs.length === 0) return { uploaded: 0, remaining: 0 };

  const token = useAuthStore.getState().accessToken;
  const connectivity = useConnectivityStore.getState();
  if (!token || !connectivity.isOnline || connectivity.isCloudReachable === 'unreachable') {
    return { uploaded: 0, remaining: jobs.length };
  }

  interface Outcome {
    job: PendingImageUpload;
    appliedItemIds: Set<string>;
    remove: boolean;
  }
  const outcomes: Outcome[] = [];
  let uploaded = 0;
  let abort = false;

  for (const job of jobs) {
    if (abort) {
      outcomes.push({ job, appliedItemIds: new Set(), remove: false });
      continue;
    }
    if (job.items.length === 0) {
      outcomes.push({ job, appliedItemIds: new Set(), remove: false });
      continue;
    }

    if (!job.key || !job.downloadUrl) {
      try {
        const info = await getInfoAsync(job.localUri);
        if (!info.exists) {
          job.lastError = 'Cached image missing';
          outcomes.push({ job, appliedItemIds: new Set(), remove: false });
          continue;
        }
        const result = await remoteUpload(
          job.localUri,
          job.filename,
          job.contentType,
          job.context,
        );
        job.key = result.key;
        job.downloadUrl = result.download_url;
        job.lastError = undefined;
        uploaded += 1;
        void mirrorAssetToNode(job.businessId, job.downloadUrl, job.localUri);
      } catch (err) {
        job.lastError = err instanceof Error ? err.message : String(err);
        outcomes.push({ job, appliedItemIds: new Set(), remove: false });
        abort = true;
        continue;
      }
    }

    const appliedItemIds = new Set<string>();
    let applied = job.items.length > 0;
    for (const item of job.items) {
      try {
        await applyUploadedImage(job, item);
        appliedItemIds.add(item.id);
      } catch (err) {
        job.lastError = err instanceof Error ? err.message : String(err);
        applied = false;
      }
    }
    outcomes.push({ job, appliedItemIds, remove: applied });
  }

  const remaining = await withQueueLock(async () => {
    const jobs = loadQueue();
    const byId = new Map(jobs.map((job) => [job.id, job]));
    for (const outcome of outcomes) {
      const current = byId.get(outcome.job.id);
      if (!current) continue;
      if (outcome.remove) {
        const stillPending = current.items.some(
          (item) => !outcome.appliedItemIds.has(item.id),
        );
        if (!stillPending) byId.delete(current.id);
        else {
          byId.set(current.id, {
            ...current,
            key: outcome.job.key,
            downloadUrl: outcome.job.downloadUrl,
            lastError: outcome.job.lastError,
          });
        }
      } else {
        byId.set(current.id, {
          ...current,
          key: outcome.job.key,
          downloadUrl: outcome.job.downloadUrl,
          lastError: outcome.job.lastError,
        });
      }
    }

    const now = Date.now();
    const next = [...byId.values()].filter((job) => {
      if (job.items.length > 0) return true;
      const created = Date.parse(job.createdAt);
      return Number.isFinite(created) && now - created < PENDING_UPLOAD_TTL_MS;
    });
    saveQueue(next);
    return next.length;
  });

  return { uploaded, remaining };
}

let flushInFlight: Promise<{ uploaded: number; remaining: number }> | null = null;

export function flushPendingImageUploads(): Promise<{
  uploaded: number;
  remaining: number;
}> {
  if (!flushInFlight) {
    flushInFlight = doFlushPendingImageUploads().finally(() => {
      flushInFlight = null;
    });
  }
  return flushInFlight;
}
