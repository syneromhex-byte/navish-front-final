export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'failed';
export type ModelFormat = 'glb' | 'gltf' | 'fbx' | 'obj' | 'skp' | '3ds';
export type ModelStatus =
  | 'uploading'
  | 'processing'
  | 'optimizing'
  | 'generating-thumbnail'
  | 'ready'
  | 'failed';
export type ProjectCategory =
  | 'kitchen'
  | 'living-room'
  | 'bedroom'
  | 'bathroom'
  | 'dining'
  | 'office'
  | 'outdoor'
  | 'custom'
  | 'other';

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  status: ProjectStatus;
  /** Room type — lets the projects list be filtered/searched by category and keeps new uploads organized. */
  category: ProjectCategory;
  thumbnailUrl?: string;
  modelFormat: ModelFormat;
  sizeBytes: number;
  originalSize?: number;
  optimizedSize?: number;
  updatedAt: string;
  createdAt: string;
  /** Set when an admin shares this model with a client — that client sees it on their "My Models" page. */
  clientEmail?: string;
  clientId?: string;
  sharedAt?: string;
  /** Direct URL to the real .glb/.gltf/.obj model — when set, the viewer loads this instead of showing an empty room. */
  modelUrl?: string;
  location?: string;
  rooms?: string[];
  uploadedBy?: string;
  modelStatus?: ModelStatus;
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

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export interface UploadProgress {
  fileName: string;
  percent: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  uploadedBytes?: number;
  totalBytes?: number;
  speed?: number;
  remainingMs?: number;
  processingSteps?: ProcessingStep[];
}
