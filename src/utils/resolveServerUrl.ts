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

export function sanitizeModelUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;

  let clean = url.trim();

  // Handle nested / double-encoded http(s) URLs (e.g. https://s3.../https%3A//s3.../file.glb)
  const encodedHttpIndex = clean.search(/https?%3A%2F%2F/i);
  if (encodedHttpIndex > 0) {
    const encodedSegment = clean.slice(encodedHttpIndex);
    try {
      clean = decodeURIComponent(encodedSegment);
    } catch {
      // Fallback if decoding fails
    }
  } else {
    // Handle unencoded nested http/https (e.g., https://domain/https://domain/file.glb)
    const nestedHttpIndex = clean.indexOf('http', 8);
    if (nestedHttpIndex > 0) {
      clean = clean.slice(nestedHttpIndex);
    }
  }

  return clean;
}

export function resolveServerUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  const cleanUrl = sanitizeModelUrl(url) || url;

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }
  const origin = getApiOrigin();
  return `${origin}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
}

/**
 * Resolves a raw model URL to a presigned, tokenized S3 URL by calling backend API
 * `/models/${databaseModelId}/presigned-url` using the actual PostgreSQL/MongoDB database primary key.
 */
export async function getAuthorizedModelUrl(
  rawUrl: string | undefined,
  databaseModelId?: string,
): Promise<string | undefined> {
  const sanitized = sanitizeModelUrl(rawUrl);
  if (!sanitized) return sanitized;

  // Blob URLs or Data URIs don't need S3 presigned tokens
  if (sanitized.startsWith('blob:') || sanitized.startsWith('data:')) {
    return sanitized;
  }

  // If URL already contains S3 presigned query parameters, return directly
  if (
    sanitized.includes('X-Amz-Algorithm') ||
    sanitized.includes('X-Amz-Signature') ||
    sanitized.includes('Signature=')
  ) {
    return sanitized;
  }

  if (!databaseModelId || typeof databaseModelId !== 'string' || databaseModelId.trim() === '') {
    return resolveServerUrl(sanitized);
  }

  const modelIdKey = databaseModelId.trim();

  // Return cached presigned URL if available and valid
  const cached = urlCache.get(modelIdKey);
  if (cached && Date.now() < cached.expiresAt) {
    return sanitizeModelUrl(cached.url);
  }

  try {
    const presignedUrl = await modelApi.getPresignedUrl(modelIdKey, 604800);
    if (!presignedUrl) {
      throw new Error(`API responded, but presignedUrl was missing or empty for databaseModelId: ${databaseModelId}`);
    }
    const cleanPresigned = sanitizeModelUrl(presignedUrl) || presignedUrl;
    // Store in cache
    urlCache.set(modelIdKey, { url: cleanPresigned, expiresAt: Date.now() + CACHE_TTL_MS });
    return cleanPresigned;
  } catch (err) {
    console.error('❌ Failed to fetch presigned URL for databaseModelId:', databaseModelId, err);
    return resolveServerUrl(sanitized);
  }
}

