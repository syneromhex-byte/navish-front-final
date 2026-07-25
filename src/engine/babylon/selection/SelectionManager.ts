import { Color3, Mesh, PointerEventTypes } from '@babylonjs/core';
import type { AbstractMesh, Observer, PointerInfo, Scene } from '@babylonjs/core';
import type { ObjectManager } from '../objects/ObjectManager';

const HIGHLIGHT_COLOR = Color3.FromHexString('#FF4D4D');

export class SelectionManager {
  private scene: Scene;
  private selectedIds: Set<string> = new Set();
  private pointerObserver: Observer<PointerInfo> | null = null;
  private onChange: ((ids: string[]) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
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
      const targetMesh = objectManager.getMesh(id) || pickedMesh;
      const isAdditive = pointerInfo.event.shiftKey;
      this.select(id, targetMesh, { additive: isAdditive });
    });
  }

  select(id: string, mesh: AbstractMesh, options: { additive?: boolean } = {}): void {
    if (!options.additive) {
      this.clearHighlights();
      this.selectedIds.clear();
    }
    this.selectedIds.add(id);

    const applyOutline = (m: AbstractMesh) => {
      if (m instanceof Mesh) {
        m.renderOutline = true;
        m.outlineColor = HIGHLIGHT_COLOR;
        m.outlineWidth = 0.04;
      }
    };

    applyOutline(mesh);
    mesh.getChildMeshes(false).forEach(applyOutline);

    this.emitChange();
  }

  deselect(id: string, mesh: AbstractMesh): void {
    this.selectedIds.delete(id);
    const removeOutline = (m: AbstractMesh) => {
      if (m instanceof Mesh) {
        m.renderOutline = false;
      }
    };

    removeOutline(mesh);
    mesh.getChildMeshes(false).forEach(removeOutline);

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
    this.scene.meshes.forEach((m) => {
      if (m instanceof Mesh) {
        m.renderOutline = false;
      }
    });
  }

  private emitChange(): void {
    this.onChange?.(this.getSelectedIds());
  }

  dispose(): void {
    if (this.pointerObserver) this.scene.onPointerObservable.remove(this.pointerObserver);
    this.clearHighlights();
  }
}
