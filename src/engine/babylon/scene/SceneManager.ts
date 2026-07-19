import { Color3, Color4, ImageProcessingConfiguration, Scene, Vector3 } from '@babylonjs/core';
import type { AbstractEngine } from '@babylonjs/core';

/**
 * Owns scene-level configuration (clear color, tonemapping, ambient) and acts
 * as the disposal root for everything else EngineManager constructs.
 */
export class SceneManager {
  private scene: Scene;

  constructor(engine: AbstractEngine) {
    this.scene = new Scene(engine);
    this.applyDefaults();
  }

  private applyDefaults(): void {
    this.scene.clearColor = new Color4(0, 0, 0, 1);
    this.scene.ambientColor = new Color3(0.15, 0.15, 0.15);

    // ACES-style filmic tonemapping for the cinematic, architectural-render look.
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType =
      ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.exposure = 1.0;
    this.scene.imageProcessingConfiguration.contrast = 1.1;

    this.scene.skipPointerMovePicking = false;
    this.scene.autoClear = true;

    // Babylon's legacy camera collision system applies `scene.gravity` as a
    // direct per-frame position offset (not a per-second acceleration), so
    // real-world -9.807 — the engine's own default — sends a walking camera
    // through the floor almost instantly. A small per-frame value keeps
    // Walk/First Person feeling grounded instead of freefalling.
    this.scene.gravity = new Vector3(0, -0.98, 0);
  }

  getScene(): Scene {
    return this.scene;
  }

  setExposure(value: number): void {
    this.scene.imageProcessingConfiguration.exposure = value;
  }

  getExposure(): number {
    return this.scene.imageProcessingConfiguration.exposure;
  }

  dispose(): void {
    this.scene.dispose();
  }
}
