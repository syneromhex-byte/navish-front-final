import { apiClient } from '../apiClient';
import type { Client, Project } from '@app-types/project.types';

import { modelApi } from '../models/modelApi';

export const projectApi = {
  list: () => apiClient.get<Project[]>('/projects').then((res) => res.data),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((res) => res.data),
  remove: (id: string) => apiClient.delete<void>(`/projects/${id}`).then((res) => res.data),
  listClients: () => apiClient.get<Client[]>('/clients').then((res) => res.data),
  getByShareToken: (shareToken: string) =>
    apiClient.get<Project>(`/projects/share/${shareToken}`).then((res) => res.data),
  uploadModel: (file: File) => modelApi.upload(file),
};
