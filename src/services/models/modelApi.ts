import axios from 'axios';
import { apiClient } from '../apiClient';
import { useUserStore } from '@store/userStore';

export const modelApi = {
  /**
   * Uploads a 3D model file to the backend server using the S3 / stream API.
   */
  upload: async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
  ) => {
    const session = useUserStore.getState();
    if (!session.isAuthenticated || !session.accessToken) {
      const err = new Error('Unauthorized');
      (err as any).response = {
        status: 401,
        data: { message: 'Unauthorized. Please log in.' },
      };
      throw err;
    }

    // Normalize role string to ensure case-insensitive matching
    const normalizedRole = session.user?.role?.toLowerCase();
    if (normalizedRole !== 'admin') {
      const err = new Error('Only administrators can upload models.');
      (err as any).response = {
        status: 403,
        data: { message: 'Only administrators can upload models.' },
      };
      throw err;
    }

    // 1. Initiate upload session on the backend
    const initRes = await apiClient.post<{
      success: boolean;
      data: {
        uploadSessionId: string;
        presignedUrl?: string;
        presignedParts?: { partNumber: number; presignedUrl: string }[];
        isMultipart: boolean;
      };
    }>('/uploads/initiate', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    });

    const { uploadSessionId, presignedUrl, isMultipart, presignedParts } = initRes.data.data;

    // 2. Perform file upload content transfer
    if (presignedUrl) {
      // S3 Direct upload via presigned PUT url
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        timeout: 0,
        onUploadProgress,
      });

      // 3. Complete upload on backend
      const completeRes = await apiClient.post<{
        success: boolean;
        data: {
          modelUrl: string;
          originalSize?: number;
          optimizedSize?: number;
          thumbnailUrl?: string;
        };
      }>('/uploads/complete', {
        uploadSessionId,
        modelName: file.name.replace(/\.[^.]+$/, ''),
      });

      const data = completeRes.data.data as any;
      return {
        ...data,
        modelUrl: data.modelUrl || data.publicUrl,
      };
    } else if (isMultipart && presignedParts) {
      // S3 Multipart chunked upload
      const uploadedParts: { partNumber: number; eTag: string }[] = [];
      const partSize = 10 * 1024 * 1024; // 10MB per part (must match PART_SIZE on backend)
      const totalParts = presignedParts.length;

      for (let i = 0; i < totalParts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);
        const part = presignedParts[i];
        if (!part) {
          throw new Error(`Missing presigned URL for part ${i + 1}`);
        }

        const partRes = await axios.put(part.presignedUrl, chunk, {
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          timeout: 0,
        });

        const eTag = partRes.headers.etag || 'local-mock-etag';

        uploadedParts.push({
          partNumber: part.partNumber,
          eTag: eTag.replace(/"/g, ''),
        });

        if (onUploadProgress) {
          onUploadProgress({
            loaded: end,
            total: file.size,
          });
        }
      }

      // 3. Complete multipart upload on backend
      const completeRes = await apiClient.post<{
        success: boolean;
        data: {
          modelUrl: string;
          originalSize?: number;
          optimizedSize?: number;
          thumbnailUrl?: string;
        };
      }>('/uploads/complete', {
        uploadSessionId,
        parts: uploadedParts,
        modelName: file.name.replace(/\.[^.]+$/, ''),
      });

      const data = completeRes.data.data as any;
      return {
        ...data,
        modelUrl: data.modelUrl || data.publicUrl,
      };
    } else {
      // Fallback: Direct stream to backend router
      const streamRes = await apiClient.post<{
        success: boolean;
        data: {
          modelUrl: string;
          originalSize?: number;
          optimizedSize?: number;
          thumbnailUrl?: string;
        };
      }>(`/uploads/stream/${uploadSessionId}`, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        timeout: 0,
        onUploadProgress,
      });

      const data = streamRes.data.data as any;
      return {
        ...data,
        modelUrl: data.modelUrl || data.publicUrl,
      };
    }
  },
};
