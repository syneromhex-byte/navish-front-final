import { Color3, PBRMaterial } from '@babylonjs/core';
import type { AbstractMesh, Scene, Texture } from '@babylonjs/core';

export interface MaterialProperties {
  albedoColor: string;
  metallic: number;
  roughness: number;
}

export type MaterialTextureChannel = 'albedo' | 'bump' | 'metallicRoughness';

const DEFAULT_PROPERTIES: MaterialProperties = {
  albedoColor: '#CCCCCC',
  metallic: 0,
  roughness: 0.6,
};

/**
 * Ensures every editable mesh has a PBRMaterial (converting/wrapping as
 * needed) and exposes live property mutation for the Material editor panel.
 * Every write here mutates the actual Babylon material — no page reload,
 * no rebuild, the GPU-resident mesh updates instantly.
 */
export class MaterialManager {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Returns the mesh's unique PBRMaterial, cloning if shared so edits don't mutate other objects. */
  getOrCreatePBRMaterial(mesh: AbstractMesh): PBRMaterial {
    const uniqueName = `${mesh.name}_mat_${mesh.uniqueId}`;
    if (mesh.material instanceof PBRMaterial) {
      if (mesh.material.name !== uniqueName) {
        const cloned = mesh.material.clone(uniqueName);
        if (cloned && cloned instanceof PBRMaterial) {
          cloned.backFaceCulling = false;
          cloned.twoSidedLighting = true;
          mesh.material = cloned;
          return cloned;
        }
      }
      mesh.material.backFaceCulling = false;
      mesh.material.twoSidedLighting = true;
      return mesh.material;
    }

    const material = new PBRMaterial(uniqueName, this.scene);
    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    material.albedoColor = Color3.FromHexString(DEFAULT_PROPERTIES.albedoColor);
    material.metallic = DEFAULT_PROPERTIES.metallic;
    material.roughness = DEFAULT_PROPERTIES.roughness;
    mesh.material = material;
    return material;
  }

  getProperties(mesh: AbstractMesh): MaterialProperties {
    const material = this.getOrCreatePBRMaterial(mesh);
    return {
      albedoColor: material.albedoColor ? material.albedoColor.toHexString() : DEFAULT_PROPERTIES.albedoColor,
      metallic: material.metallic ?? 0,
      roughness: material.roughness ?? 0.6,
    };
  }

  updateProperties(mesh: AbstractMesh, update: Partial<MaterialProperties>): void {
    const mat = this.getOrCreatePBRMaterial(mesh);
    if (update.albedoColor !== undefined) {
      mat.albedoColor = Color3.FromHexString(update.albedoColor);
    }
    if (update.metallic !== undefined) {
      mat.metallic = update.metallic;
    }
    if (update.roughness !== undefined) {
      mat.roughness = update.roughness;
    }
  }

  applyTexture(mesh: AbstractMesh, channel: MaterialTextureChannel, texture: Texture | null): void {
    const material = this.getOrCreatePBRMaterial(mesh);
    switch (channel) {
      case 'albedo':
        material.albedoTexture?.dispose();
        material.albedoTexture = texture;
        if (texture) {
          material.albedoColor = Color3.White();
        }
        break;
      case 'bump':
        material.bumpTexture?.dispose();
        material.bumpTexture = texture;
        break;
      case 'metallicRoughness':
        material.metallicTexture?.dispose();
        material.metallicTexture = texture;
        if (texture) {
          material.useRoughnessFromMetallicTextureAlpha = false;
          material.useRoughnessFromMetallicTextureGreen = true;
          material.useMetallnessFromMetallicTextureBlue = true;
        }
        break;
    }
  }

  dispose(): void {
    // Materials are owned by the scene and disposed with their meshes; nothing to clean up here.
  }
}
