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

export function isValidDatabaseId(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('s3://') ||
    trimmed.endsWith('.glb') ||
    trimmed.endsWith('.gltf') ||
    trimmed.endsWith('.obj') ||
    trimmed.startsWith('port_')
  ) {
    return false;
  }
  return true;
}

export function sanitizeModelUrl(url: string | undefined): string | undefined {
  if (!url || typeof url !== 'string') return url;

  let clean = url.trim();

  // If the entire URL or scheme is double-encoded (e.g., https%3A%2F%2F), decode it back
  if (
    clean.startsWith('http%3A') ||
    clean.startsWith('https%3A') ||
    clean.startsWith('http%3a') ||
    clean.startsWith('https%3a') ||
    clean.includes('%3A%2F%2F') ||
    clean.includes('%3a%2f%2f')
  ) {
    try {
      clean = decodeURIComponent(clean);
    } catch {
      // Fallback if decoding fails
    }
  }

  // Convert s3://bucket/key to https://bucket.s3.us-east-1.amazonaws.com/key
  if (clean.startsWith('s3://')) {
    const s3Path = clean.slice(5);
    const firstSlash = s3Path.indexOf('/');
    if (firstSlash !== -1) {
      const bucket = s3Path.slice(0, firstSlash);
      const key = s3Path.slice(firstSlash + 1).replace(/^\/+/, '');
      clean = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
    }
  }

  // Normalize leading slash for relative S3 key paths (e.g. /temp/ -> temp/)
  if (clean.startsWith('/temp/')) {
    clean = clean.slice(1);
  }

  // Convert relative S3 key paths starting with temp/ to full us-east-1 S3 URL
  if (clean.startsWith('temp/')) {
    clean = `https://navish-arc-assets-2026.s3.us-east-1.amazonaws.com/${clean}`;
  }

  // Handle nested / double-encoded http(s) URLs (e.g. https://s3.../https%3A//s3.../file.glb)
  const encodedHttpIndex = clean.search(/https?%3A%2F%2F/i);
  if (encodedHttpIndex >= 0) {
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

  // Handle double-queried strings (multiple '?' separators in a single URL)
  if (clean.includes('?') && clean.indexOf('?') !== clean.lastIndexOf('?')) {
    const firstQueryIndex = clean.indexOf('?');
    const baseUrl = clean.slice(0, firstQueryIndex);
    const queryPart = clean.slice(firstQueryIndex + 1).replace(/\?/g, '&');
    clean = `${baseUrl}?${queryPart}`;
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

  if (!databaseModelId || !isValidDatabaseId(databaseModelId)) {
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

