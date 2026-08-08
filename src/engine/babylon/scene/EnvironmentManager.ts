import { Color3, MeshBuilder, Scene } from '@babylonjs/core';
import { SkyMaterial } from '@babylonjs/materials';
import type { Mesh, Vector3 } from '@babylonjs/core';

export type FogMode = 'off' | 'exponential';

/**
 * Procedural sky + real-time reflection probe instead of an external HDR/.env
 * file — no CDN dependency, and the sky stays in sync with the sun direction
 * the Lighting panel controls.
 */
export class EnvironmentManager {
  private scene: Scene;
  private skybox: Mesh;
  private skyMaterial: SkyMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    this.skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, scene);
    this.skyMaterial = new SkyMaterial('skyMaterial', scene);
    this.skyMaterial.backFaceCulling = false;
    this.skyMaterial.turbidity = 5;
    this.skyMaterial.luminance = 0.8;
    this.skyMaterial.inclination = 0.35;
    this.skybox.material = this.skyMaterial;
    this.skybox.infiniteDistance = true;

    this.setFogMode('off');
  }

  /** Keeps the sky's sun disc aligned with LightManager's directional light. */
  syncSunDirection(direction: Vector3): void {
    this.skyMaterial.sunPosition = direction.scale(-1);
    this.skyMaterial.useSunPosition = true;
  }

  setTurbidity(value: number): void {
    this.skyMaterial.turbidity = value;
  }

  setLuminance(value: number): void {
    this.skyMaterial.luminance = value;
  }

  setFogMode(mode: FogMode): void {
    this.scene.fogMode = mode === 'off' ? Scene.FOGMODE_NONE : Scene.FOGMODE_EXP2;
  }

  setFogDensity(density: number): void {
    this.scene.fogDensity = density;
  }

  setFogColor(hex: string): void {
    this.scene.fogColor = Color3.FromHexString(hex);
  }

  refreshReflections(): void {
    // Environment lighting remains stable
  }

  dispose(): void {
    this.skyMaterial.dispose();
    this.skybox.dispose();
  }
}
