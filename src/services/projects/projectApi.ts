import { apiClient } from '../apiClient';
import type { Client, Project } from '@app-types/project.types';

export const projectApi = {
  list: () => apiClient.get<Project[]>('/projects').then((res) => res.data),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((res) => res.data),
  remove: (id: string) => apiClient.delete<void>(`/projects/${id}`).then((res) => res.data),
  listClients: () => apiClient.get<Client[]>('/clients').then((res) => res.data),
};
