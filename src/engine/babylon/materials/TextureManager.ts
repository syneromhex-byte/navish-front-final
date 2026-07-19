import { Texture } from '@babylonjs/core';
import {
  BrickProceduralTexture,
  GrassProceduralTexture,
  MarbleProceduralTexture,
  WoodProceduralTexture,
} from '@babylonjs/procedural-textures';
import type { Scene } from '@babylonjs/core';

export type ProceduralTextureKind = 'wood' | 'marble' | 'brick' | 'grass';

const PROCEDURAL_SIZE = 512;

/**
 * Owns texture creation/caching. Built-in procedural textures (wood, marble,
 * brick, grass) give the material library real, good-looking swatches with
 * no external asset dependency; `loadFromUrl` handles real project assets
 * (including KTX2 — Babylon's Texture class auto-detects and transcodes it).
 */
export class TextureManager {
  private scene: Scene;
  private urlCache = new Map<string, Texture>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createProceduralTexture(kind: ProceduralTextureKind, uScale = 4, vScale = 4): Texture {
    let texture: Texture;
    switch (kind) {
      case 'wood':
        texture = new WoodProceduralTexture(`wood_${Date.now()}`, PROCEDURAL_SIZE, this.scene);
        break;
      case 'marble':
        texture = new MarbleProceduralTexture(`marble_${Date.now()}`, PROCEDURAL_SIZE, this.scene);
        break;
      case 'brick':
        texture = new BrickProceduralTexture(`brick_${Date.now()}`, PROCEDURAL_SIZE, this.scene);
        break;
      case 'grass':
        texture = new GrassProceduralTexture(`grass_${Date.now()}`, PROCEDURAL_SIZE, this.scene);
        break;
    }
    texture.uScale = uScale;
    texture.vScale = vScale;
    return texture;
  }

  loadFromUrl(url: string): Texture {
    const cached = this.urlCache.get(url);
    if (cached) return cached;

    const texture = new Texture(url, this.scene, false, true);
    this.urlCache.set(url, texture);
    return texture;
  }

  setTiling(texture: Texture, uScale: number, vScale: number): void {
    texture.uScale = uScale;
    texture.vScale = vScale;
  }

  dispose(): void {
    this.urlCache.forEach((texture) => texture.dispose());
    this.urlCache.clear();
  }
}
