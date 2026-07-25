import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type { Client, Project } from '@app-types/project.types';
import { modelApi } from '../models/modelApi';

export const projectApi = {
  list: () =>
    apiClient
      .get<ApiEnvelope<Project[]>>('/projects')
      .then((res) => res.data.data),

  get: (id: string) =>
    apiClient
      .get<ApiEnvelope<Project>>(`/projects/${id}`)
      .then((res) => res.data.data),

  create: (data: Partial<Project>) =>
    apiClient
      .post<ApiEnvelope<Project>>('/projects', data)
      .then((res) => res.data.data),

  update: (id: string, data: Partial<Project>) =>
    apiClient
      .put<ApiEnvelope<Project>>(`/projects/${id}`, data)
      .then((res) => res.data.data),

  remove: (id: string) =>
    apiClient
      .delete<ApiEnvelope<void>>(`/projects/${id}`)
      .then((res) => res.data.data),

  listClients: () =>
    apiClient
      .get<ApiEnvelope<Client[]>>('/clients')
      .then((res) => res.data.data),

  getByShareToken: (token: string) =>
    apiClient
      .get<ApiEnvelope<Project>>(`/projects/share/${token}`)
      .then((res) => res.data.data),

  uploadModel: (file: File) => modelApi.upload(file),
};
