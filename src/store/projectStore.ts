import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectCategory, UploadProgress } from '@app-types/project.types';

export interface NewProjectInput {
  name: string;
  category: ProjectCategory;
  clientName?: string;
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  uploads: UploadProgress[];
  setProjects: (projects: Project[]) => void;
  addProject: (input: NewProjectInput) => Project;
  removeProject: (id: string) => void;
  shareWithClient: (id: string, clientEmail: string) => void;
  setModelUrl: (id: string, modelUrl: string) => void;
  setLoading: (isLoading: boolean) => void;
  pushUpload: (upload: UploadProgress) => void;
  updateUpload: (fileName: string, patch: Partial<UploadProgress>) => void;
  clearUpload: (fileName: string) => void;
}

// Persisted so admin actions (creating a project, sharing it, linking a real
// model URL) survive a page reload — no backend/database exists yet to hold
// this durably otherwise. `uploads` is left out: in-progress upload state
// shouldn't "resume" a stale progress bar after a reload. Starts empty —
// `addProject` is how the studio's own upload process adds a new entry.
export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      isLoading: false,
      uploads: [],
      setProjects: (projects) => set({ projects }),
      addProject: (input) => {
        const now = new Date().toISOString();
        const project: Project = {
          id: `project-${Date.now().toString(36)}`,
          name: input.name,
          clientName: input.clientName?.trim() || 'Unassigned',
          category: input.category,
          status: 'draft',
          modelFormat: 'glb',
          sizeBytes: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },
      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((project) => project.id !== id) })),
      shareWithClient: (id, clientEmail) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, clientEmail, sharedAt: new Date().toISOString() }
              : project,
          ),
        })),
      setModelUrl: (id, modelUrl) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, modelUrl, status: 'ready', updatedAt: new Date().toISOString() }
              : project,
          ),
        })),
      setLoading: (isLoading) => set({ isLoading }),
      pushUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
      updateUpload: (fileName, patch) =>
        set((state) => ({
          uploads: state.uploads.map((upload) =>
            upload.fileName === fileName ? { ...upload, ...patch } : upload,
          ),
        })),
      clearUpload: (fileName) =>
        set((state) => ({
          uploads: state.uploads.filter((upload) => upload.fileName !== fileName),
        })),
    }),
    {
      name: 'navish-arc-projects',
      partialize: (state) => ({ projects: state.projects }),
    },
  ),
);
