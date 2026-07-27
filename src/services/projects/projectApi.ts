import { apiClient } from '../apiClient';
import type { ApiEnvelope } from '@app-types/api.types';
import type { Client, Project } from '@app-types/project.types';
import { modelApi } from '../models/modelApi';

function mapProjectModelUrl(project: Project & { presignedUrl?: string }): Project {
  if (!project) return project;
  if (project.presignedUrl) {
    return {
      ...project,
      modelUrl: project.presignedUrl,
    };
  }
  return project;
}

export const projectApi = {
  list: () =>
    apiClient
      .get<ApiEnvelope<(Project & { presignedUrl?: string })[]>>('/projects')
      .then((res) => (res.data.data || []).map(mapProjectModelUrl)),

  get: (id: string) =>
    apiClient
      .get<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/${id}`)
      .then((res) => mapProjectModelUrl(res.data.data)),

  create: (data: Partial<Project>) =>
    apiClient
      .post<ApiEnvelope<Project & { presignedUrl?: string }>>('/projects', data)
      .then((res) => mapProjectModelUrl(res.data.data)),

  update: (id: string, data: Partial<Project>) =>
    apiClient
      .put<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/${id}`, data)
      .then((res) => mapProjectModelUrl(res.data.data)),

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
      .get<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/share/${token}`)
      .then((res) => mapProjectModelUrl(res.data.data)),

  uploadModel: (file: File) => modelApi.upload(file),
};
