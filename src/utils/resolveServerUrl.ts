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
  * `/models/${id}/presigned-url` if the URL is an untokenized S3 URL.
  */
export async function getAuthorizedModelUrl(
  rawUrl: string | undefined,
  modelOrProjectId?: string,
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

  // Collect candidate model IDs to request presigned URL
  const candidateIds: string[] = [];
  if (modelOrProjectId) {
    candidateIds.push(modelOrProjectId);
  }

  // Extract ID or UUID from filename (e.g. .../650b76b2-8e5d-4dba-8bcb-df91f60b13ad.glb -> 650b76b2-8e5d-4dba-8bcb-df91f60b13ad)
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const urlObj = new URL(rawUrl, origin);
    const filename = urlObj.pathname.split('/').pop() || '';
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    if (nameWithoutExt && !candidateIds.includes(nameWithoutExt)) {
      candidateIds.push(nameWithoutExt);
    }
  } catch {
    // Ignore parse error
  }

  for (const id of candidateIds) {
    try {
      const presignedUrl = await modelApi.getPresignedUrl(id);
      if (presignedUrl) {
        return presignedUrl;
      }
    } catch {
      // Ignore and attempt next candidate ID
    }
  }

  return resolveServerUrl(rawUrl);
}

