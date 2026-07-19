import { apiClient } from '../apiClient';
import { useUserStore } from '@store/userStore';

export const modelApi = {
  /**
   * Uploads a 3D model file to the backend server.
   * Restricts uploads exclusively to administrators by verifying authorization parameters locally before dispatching request.
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

    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<{
        modelUrl: string;
        originalSize?: number;
        optimizedSize?: number;
        thumbnailUrl?: string;
      }>('/models/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      })
      .then((res) => res.data);
  },
};
