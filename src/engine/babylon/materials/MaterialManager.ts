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

  /** Returns the mesh's PBRMaterial, creating one with sane defaults if it doesn't have one. */
  getOrCreatePBRMaterial(mesh: AbstractMesh): PBRMaterial {
    if (mesh.material instanceof PBRMaterial) {
      return mesh.material;
    }

    const material = new PBRMaterial(`${mesh.name}_material`, this.scene);
    material.albedoColor = Color3.FromHexString(DEFAULT_PROPERTIES.albedoColor);
    material.metallic = DEFAULT_PROPERTIES.metallic;
    material.roughness = DEFAULT_PROPERTIES.roughness;
    mesh.material = material;
    return material;
  }

  getProperties(mesh: AbstractMesh): MaterialProperties | null {
    if (!(mesh.material instanceof PBRMaterial)) return null;
    const material = mesh.material;
    return {
      albedoColor: material.albedoColor.toHexString(),
      metallic: material.metallic ?? 0,
      roughness: material.roughness ?? 0.6,
    };
  }

  updateProperties(mesh: AbstractMesh, update: Partial<MaterialProperties>): void {
    const material = this.getOrCreatePBRMaterial(mesh);
    if (update.albedoColor !== undefined) {
      material.albedoColor = Color3.FromHexString(update.albedoColor);
    }
    if (update.metallic !== undefined) {
      material.metallic = update.metallic;
    }
    if (update.roughness !== undefined) {
      material.roughness = update.roughness;
    }
  }

  applyTexture(mesh: AbstractMesh, channel: MaterialTextureChannel, texture: Texture | null): void {
    const material = this.getOrCreatePBRMaterial(mesh);
    switch (channel) {
      case 'albedo':
        material.albedoTexture?.dispose();
        material.albedoTexture = texture;
        // albedoColor multiplies the texture — reset to white so a newly
        // applied texture shows in its natural colors, not tinted by
        // whatever base color was set before.
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
