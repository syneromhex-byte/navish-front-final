import { create } from 'zustand';
import type {
  CameraMode,
  EngineStats,
  LoadedModelMetadata,
  ModelLoadStatus,
} from '@app-types/viewer.types';

interface ViewerState {
  isEngineReady: boolean;
  loadStatus: ModelLoadStatus;
  loadProgress: number;
  loadError: string | null;
  model: LoadedModelMetadata | null;
  cameraMode: CameraMode;
  stats: EngineStats;
  setEngineReady: (isReady: boolean) => void;
  setLoadStatus: (status: ModelLoadStatus) => void;
  setLoadProgress: (percent: number) => void;
  setLoadError: (error: string | null) => void;
  setModel: (model: LoadedModelMetadata | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setStats: (stats: EngineStats) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  isEngineReady: false,
  loadStatus: 'idle',
  loadProgress: 0,
  loadError: null,
  model: null,
  cameraMode: 'orbit',
  stats: { fps: 0, drawCalls: 0, activeMeshes: 0 },
  setEngineReady: (isEngineReady) => set({ isEngineReady }),
  setLoadStatus: (loadStatus) => set({ loadStatus }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setLoadError: (loadError) => set({ loadError }),
  setModel: (model) => set({ model }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setStats: (stats) => set({ stats }),
}));
