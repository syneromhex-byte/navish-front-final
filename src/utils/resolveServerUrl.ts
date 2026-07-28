import { modelApi } from '@services/modelApi';

export function resolveServerUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  const cleanUrl =
    url.startsWith('blob:') || url.startsWith('data:')
      ? url
      : url.replace('/temp/models/', '/temp/').replace('/models/', '/temp/');

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://navish-arc.site/api/v1';
  let origin = apiBase;
  try {
    origin = new URL(apiBase).origin;
  } catch {
    // Fallback if apiBase is just a path or invalid URL
  }
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
  if (!rawUrl) return rawUrl;

  // Blob URLs or Data URIs don't need S3 presigned tokens
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  // If URL already contains S3 presigned query parameters, sanitize and return
  if (
    rawUrl.includes('X-Amz-Algorithm') ||
    rawUrl.includes('X-Amz-Signature') ||
    rawUrl.includes('Signature=')
  ) {
    return rawUrl.replace('/temp/models/', '/temp/').replace('/models/', '/temp/');
  }

  if (!databaseModelId || typeof databaseModelId !== 'string' || databaseModelId.trim() === '') {
    console.warn('⚠️ getAuthorizedModelUrl called without a valid databaseModelId! Falling back to raw URL.', {
      rawUrl,
      databaseModelId,
    });
    return resolveServerUrl(rawUrl);
  }

  try {
    const presignedUrl = await modelApi.getPresignedUrl(databaseModelId.trim());
    if (!presignedUrl) {
      throw new Error(`API responded, but presignedUrl was missing or empty for databaseModelId: ${databaseModelId}`);
    }
    return presignedUrl.replace('/temp/models/', '/temp/').replace('/models/', '/temp/');
  } catch (err) {
    console.error('❌ Failed to fetch presigned URL for databaseModelId:', databaseModelId, err);
    throw err;
  }
}

