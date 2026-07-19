import { Color3, HighlightLayer, Mesh, PointerEventTypes } from '@babylonjs/core';
import type { AbstractMesh, Observer, PointerInfo, Scene } from '@babylonjs/core';
import type { ObjectManager } from '../objects/ObjectManager';

const HIGHLIGHT_COLOR = Color3.FromHexString('#FF4D4D');

export class SelectionManager {
  private scene: Scene;
  private highlightLayer: HighlightLayer;
  private selectedIds: Set<string> = new Set();
  private pointerObserver: Observer<PointerInfo> | null = null;
  private onChange: ((ids: string[]) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.highlightLayer = new HighlightLayer('selectionHighlight', scene);
  }

  onSelectionChange(callback: (ids: string[]) => void): void {
    this.onChange = callback;
  }

  /** Click-to-select via scene pointer picking. Ignores drags so orbit-camera controls aren't hijacked. */
  enablePointerSelection(objectManager: ObjectManager): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERTAP) return;

      const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
      if (!pickedMesh) {
        this.clear();
        return;
      }

      const id = objectManager.getIdForMesh(pickedMesh);
      if (!id) return;

      const isAdditive = pointerInfo.event.shiftKey;
      this.select(id, pickedMesh, { additive: isAdditive });
    });
  }

  select(id: string, mesh: AbstractMesh, options: { additive?: boolean } = {}): void {
    if (!options.additive) {
      this.clearHighlights();
      this.selectedIds.clear();
    }
    this.selectedIds.add(id);
    if (mesh instanceof Mesh) {
      this.highlightLayer.addMesh(mesh, HIGHLIGHT_COLOR);
    }
    this.emitChange();
  }

  deselect(id: string, mesh: AbstractMesh): void {
    this.selectedIds.delete(id);
    if (mesh instanceof Mesh) {
      this.highlightLayer.removeMesh(mesh);
    }
    this.emitChange();
  }

  clear(): void {
    this.clearHighlights();
    this.selectedIds.clear();
    this.emitChange();
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  private clearHighlights(): void {
    this.highlightLayer.removeAllMeshes();
  }

  private emitChange(): void {
    this.onChange?.(this.getSelectedIds());
  }

  dispose(): void {
    if (this.pointerObserver) this.scene.onPointerObservable.remove(this.pointerObserver);
    this.highlightLayer.dispose();
  }
}
