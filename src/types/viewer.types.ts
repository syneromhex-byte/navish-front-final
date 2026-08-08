export type CameraMode = 'orbit' | 'firstPerson' | 'walk' | 'fly' | 'cinematic';

export type ModelSourceFormat = 'glb' | 'gltf' | 'fbx' | 'obj';

export type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ModelLoadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface LoadedModelMetadata {
  rootId: string;
  fileName: string;
  format: ModelSourceFormat;
  meshCount: number;
  materialCount: number;
  boundingRadius: number;
}

export interface EngineStats {
  fps: number;
  drawCalls: number;
  activeMeshes: number;
}
