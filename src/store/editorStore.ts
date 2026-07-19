import { create } from 'zustand';

export type ToolMode = 'select' | 'move' | 'rotate' | 'scale';

interface EditorState {
  toolMode: ToolMode;
  selectedIds: string[];
  setToolMode: (mode: ToolMode) => void;
  setSelectedIds: (ids: string[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  toolMode: 'select',
  selectedIds: [],
  setToolMode: (toolMode) => set({ toolMode }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
}));
