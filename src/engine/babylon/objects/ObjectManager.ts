import type { AbstractMesh } from '@babylonjs/core';

export type SceneObjectCategory = 'wall' | 'floor' | 'furniture' | 'door' | 'window' | 'other';

export interface SceneObjectEntry {
  id: string;
  name: string;
  category: SceneObjectCategory;
  mesh: AbstractMesh;
}

/** Registry mapping stable string ids to live meshes, for UI (ObjectPanel, selection) to reference. */
export class ObjectManager {
  private registry = new Map<string, SceneObjectEntry>();

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

  getIdForMesh(mesh: AbstractMesh): string | undefined {
    return this.registry.get(mesh.uniqueId.toString())?.id;
  }

  getAll(): SceneObjectEntry[] {
    return Array.from(this.registry.values());
  }

  clear(): void {
    this.registry.clear();
  }
}
