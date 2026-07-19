import { create } from 'zustand';

interface PendingLocalModel {
  projectId: string;
  file: File;
  /**
   * Every file from the same picker selection, including `file` itself. A
   * .gltf (as opposed to self-contained .glb) references its geometry
   * buffer and textures as separate sibling files — without them selected
   * and registered with Babylon's FilesInputStore, those references fail to
   * resolve and the model loads with missing textures/geometry.
   */
  siblingFiles: File[];
}

interface LocalModelState {
  pending: PendingLocalModel | null;
  setPending: (projectId: string, file: File, siblingFiles: File[]) => void;
  clearPending: () => void;
}

// Deliberately NOT persisted — a File object can't be serialized to
// localStorage, and a locally-picked file only ever makes sense for the
// browser tab that picked it. This just bridges "user chose a file" (on the
// Projects page) to "the viewer should load that exact file" (on the next
// page) without a network round trip.
export const useLocalModelStore = create<LocalModelState>((set) => ({
  pending: null,
  setPending: (projectId, file, siblingFiles) => set({ pending: { projectId, file, siblingFiles } }),
  clearPending: () => set({ pending: null }),
}));
