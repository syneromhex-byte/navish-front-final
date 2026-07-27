import { modelApi } from '@services/modelApi';

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
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://navish-arc.site/api/v1';
  let origin = apiBase;
  try {
    origin = new URL(apiBase).origin;
  } catch {
    // Fallback if apiBase is just a path or invalid URL
  }
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

  // If URL already contains S3 presigned query parameters, return as-is
  if (
    rawUrl.includes('X-Amz-Algorithm') ||
    rawUrl.includes('X-Amz-Signature') ||
    rawUrl.includes('Signature=')
  ) {
    return rawUrl;
  }

  // Option A: Call /api/v1/models/<DATABASE_MODEL_ID>/presigned-url using the actual primary key
  if (databaseModelId && typeof databaseModelId === 'string' && databaseModelId.trim() !== '') {
    try {
      const presignedUrl = await modelApi.getPresignedUrl(databaseModelId.trim());
      if (presignedUrl) {
        return presignedUrl;
      }
    } catch (err) {
      console.warn(`Failed to fetch presigned URL for model ID ${databaseModelId}:`, err);
    }
  }

  return resolveServerUrl(rawUrl);
}

