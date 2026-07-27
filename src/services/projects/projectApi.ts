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
      .then((res) => {
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).map(mapProjectModelUrl);
      }),

  get: (id: string) =>
    apiClient
      .get<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/${id}`)
      .then((res) => mapProjectModelUrl((res.data?.data ?? res.data) as any)),

  create: (data: Partial<Project>) =>
    apiClient
      .post<ApiEnvelope<Project & { presignedUrl?: string }>>('/projects', data)
      .then((res) => mapProjectModelUrl((res.data?.data ?? res.data) as any)),

  update: (id: string, data: Partial<Project>) =>
    apiClient
      .put<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/${id}`, data)
      .then((res) => mapProjectModelUrl((res.data?.data ?? res.data) as any)),

  remove: (id: string) =>
    apiClient
      .delete<ApiEnvelope<void>>(`/projects/${id}`)
      .then((res) => (res.data?.data ?? res.data) as void),

  listClients: () =>
    apiClient
      .get<ApiEnvelope<Client[]>>('/clients')
      .then((res) => {
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []) as Client[];
      }),

  getByShareToken: (token: string) =>
    apiClient
      .get<ApiEnvelope<Project & { presignedUrl?: string }>>(`/projects/share/${token}`)
      .then((res) => mapProjectModelUrl((res.data?.data ?? res.data) as any)),

  uploadModel: (file: File) => modelApi.upload(file),
};
