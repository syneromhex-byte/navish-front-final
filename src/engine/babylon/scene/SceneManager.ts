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
    this.scene.clearColor = new Color4(0.04, 0.05, 0.07, 1);
    this.scene.ambientColor = new Color3(0.55, 0.55, 0.55);

    // ACES-style filmic tonemapping for the cinematic, architectural-render look.
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType =
      ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.exposure = 1.25;
    this.scene.imageProcessingConfiguration.contrast = 1.15;

    this.scene.skipPointerMovePicking = false;
    this.scene.autoClear = true;

    // Enable global scene collision checks so camera collision and wall/floor sliding work properly
    this.scene.collisionsEnabled = true;
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
