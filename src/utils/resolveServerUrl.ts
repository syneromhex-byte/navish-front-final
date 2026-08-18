import { modelApi } from '@services/modelApi';

// In-memory cache for presigned URLs (cached for 1 hour to eliminate redundant network requests)
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function getApiOrigin(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('navish-arc.site')) {
    try {
      return new URL(envUrl).origin;
    } catch {
      // Fallback
    }
  }
  if (
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000';
  }
  const fallback = envUrl || 'https://navish-arc.site/api/v1';
  try {
    return new URL(fallback).origin;
  } catch {
    return 'https://navish-arc.site';
  }
}

export function resolveServerUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const origin = getApiOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Resolves a raw model URL to a presigned, tokenized S3 URL by calling backend API
 * `/models/${databaseModelId}/presigned-url` using the actual PostgreSQL/MongoDB database primary key.
 */
export async function getAuthorizedModelUrl(
  rawUrl: string | undefined,
  databaseModelId?: string,
): Promise<string | undefined> {
  if (!rawUrl) return rawUrl;

  // Blob URLs or Data URIs don't need S3 presigned tokens
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  // If URL already contains S3 presigned query parameters, return directly
  if (
    rawUrl.includes('X-Amz-Algorithm') ||
    rawUrl.includes('X-Amz-Signature') ||
    rawUrl.includes('Signature=')
  ) {
    return rawUrl;
  }

  if (!databaseModelId || typeof databaseModelId !== 'string' || databaseModelId.trim() === '') {
    return resolveServerUrl(rawUrl);
  }

  const modelIdKey = databaseModelId.trim();

  // Return cached presigned URL if available and valid
  const cached = urlCache.get(modelIdKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }

  try {
    const presignedUrl = await modelApi.getPresignedUrl(modelIdKey, 604800);
    if (!presignedUrl) {
      throw new Error(`API responded, but presignedUrl was missing or empty for databaseModelId: ${databaseModelId}`);
    }
    // Store in cache
    urlCache.set(modelIdKey, { url: presignedUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    return presignedUrl;
  } catch (err) {
    console.error('❌ Failed to fetch presigned URL for databaseModelId:', databaseModelId, err);
    return resolveServerUrl(rawUrl);
  }
}

