export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'failed';
export type ModelFormat = 'glb' | 'gltf' | 'fbx' | 'obj';
export type ProjectCategory =
  | 'kitchen'
  | 'living-room'
  | 'bedroom'
  | 'bathroom'
  | 'outdoor'
  | 'other';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  /** Room type — lets the projects list be filtered/searched by category and keeps new uploads organized. */
  category: ProjectCategory;
  thumbnailUrl?: string;
  modelFormat: ModelFormat;
  sizeBytes: number;
  updatedAt: string;
  createdAt: string;
  /** Set when an admin shares this model with a client — that client sees it on their "My Models" page. */
  clientEmail?: string;
  sharedAt?: string;
  /** Direct URL to the real .glb/.gltf/.obj model — when set, the viewer loads this instead of showing an empty room. */
  modelUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  projectCount: number;
  /** Set when this client record came from a Contact page inquiry rather than an existing project. */
  message?: string;
  projectType?: string;
  createdAt?: string;
}

export interface UploadProgress {
  fileName: string;
  percent: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}
