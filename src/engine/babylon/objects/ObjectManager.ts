import type { AbstractMesh, Material, Quaternion, Vector3 } from '@babylonjs/core';

export type SceneObjectCategory = 'wall' | 'floor' | 'furniture' | 'door' | 'window' | 'other';

export interface SceneObjectEntry {
  id: string;
  name: string;
  category: SceneObjectCategory;
  mesh: AbstractMesh;
}

interface InitialStateSnapshot {
  mesh: AbstractMesh;
  originalMaterial: Material | null;
  position: Vector3;
  rotation: Vector3;
  rotationQuaternion: Quaternion | null;
  scaling: Vector3;
}

/** Registry mapping stable string ids to live meshes, for UI (ObjectPanel, selection) to reference. */
export class ObjectManager {
  private registry = new Map<string, SceneObjectEntry>();
  private initialSnapshots = new Map<number, InitialStateSnapshot>();

  register(mesh: AbstractMesh, category: SceneObjectCategory = 'other'): SceneObjectEntry {
    const id = mesh.uniqueId.toString();
    const entry: SceneObjectEntry = { id, name: mesh.name, category, mesh };
    this.registry.set(id, entry);
    return entry;
  }

  unregister(id: string): void {
    this.registry.delete(id);
  }

  get(id: string): SceneObjectEntry | undefined {
    return this.registry.get(id);
  }

  getMesh(id: string): AbstractMesh | undefined {
    return this.registry.get(id)?.mesh;
  }

  getIdForMesh(mesh: AbstractMesh): string {
    const existing = this.registry.get(mesh.uniqueId.toString());
    if (existing) return existing.id;

    if (mesh.parent && 'uniqueId' in mesh.parent) {
      const parentId = this.registry.get((mesh.parent as AbstractMesh).uniqueId.toString())?.id;
      if (parentId) return parentId;
    }

    const entry = this.register(mesh, 'other');
    return entry.id;
  }

  getAll(): SceneObjectEntry[] {
    return Array.from(this.registry.values());
  }

  captureInitialState(): void {
    this.initialSnapshots.clear();
    this.registry.forEach((entry) => {
      const mesh = entry.mesh;
      const childMeshes = mesh.getChildMeshes(false);
      const allMeshes = [mesh, ...childMeshes];

      allMeshes.forEach((m) => {
        if (!this.initialSnapshots.has(m.uniqueId)) {
          this.initialSnapshots.set(m.uniqueId, {
            mesh: m,
            originalMaterial: m.material ? m.material.clone(`orig_${m.uniqueId}`) : null,
            position: m.position.clone(),
            rotation: m.rotation.clone(),
            rotationQuaternion: m.rotationQuaternion ? m.rotationQuaternion.clone() : null,
            scaling: m.scaling.clone(),
          });
        }
      });
    });
  }

  resetAllObjects(): void {
    this.initialSnapshots.forEach((snapshot) => {
      const { mesh, originalMaterial, position, rotation, rotationQuaternion, scaling } = snapshot;
      if (originalMaterial) {
        mesh.material = originalMaterial.clone(`reset_${mesh.uniqueId}`);
      } else {
        mesh.material = null;
      }
      mesh.position.copyFrom(position);
      mesh.rotation.copyFrom(rotation);
      mesh.scaling.copyFrom(scaling);
      if (rotationQuaternion && mesh.rotationQuaternion) {
        mesh.rotationQuaternion.copyFrom(rotationQuaternion);
      }
    });
  }

  clear(): void {
    this.registry.clear();
    this.initialSnapshots.clear();
  }
}
