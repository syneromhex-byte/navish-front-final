import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  ShadowGenerator,
  Vector3,
} from '@babylonjs/core';
import type { Scene, ShadowLight } from '@babylonjs/core';

export type ShadowQuality = 'off' | 'low' | 'medium' | 'high';

const SHADOW_MAP_SIZE: Record<Exclude<ShadowQuality, 'off'>, number> = {
  low: 512,
  medium: 1024,
  high: 2048,
};

export class LightManager {
  private ambientLight: HemisphericLight;
  private sunLight: DirectionalLight;
  private shadowGenerator: ShadowGenerator | null = null;
  private shadowQuality: ShadowQuality = 'medium';

  constructor(scene: Scene) {
    this.ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), scene);
    this.ambientLight.intensity = 0.6;
    this.ambientLight.diffuse = new Color3(1, 1, 1);
    this.ambientLight.groundColor = new Color3(0.35, 0.32, 0.3);

    this.sunLight = new DirectionalLight('sunLight', new Vector3(-0.5, -1, -0.3), scene);
    this.sunLight.intensity = 2.2;
    this.sunLight.diffuse = new Color3(1, 0.97, 0.92);

    this.setShadowQuality('medium');
  }

  /** Sun position in degrees — azimuth (0-360) and elevation (0-90). */
  setSunPosition(azimuthDeg: number, elevationDeg: number): void {
    const azimuth = (azimuthDeg * Math.PI) / 180;
    const elevation = (elevationDeg * Math.PI) / 180;

    const x = Math.cos(elevation) * Math.sin(azimuth);
    const y = -Math.sin(elevation);
    const z = Math.cos(elevation) * Math.cos(azimuth);
    this.sunLight.direction = new Vector3(x, y, z).normalize();
  }

  setSunIntensity(intensity: number): void {
    this.sunLight.intensity = intensity;
  }

  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  setShadowQuality(quality: ShadowQuality): void {
    this.shadowQuality = quality;

    if (quality === 'off') {
      this.shadowGenerator?.dispose();
      this.shadowGenerator = null;
      return;
    }

    const mapSize = SHADOW_MAP_SIZE[quality];
    if (!this.shadowGenerator) {
      this.shadowGenerator = new ShadowGenerator(mapSize, this.sunLight as ShadowLight);
      this.shadowGenerator.usePoissonSampling = true;
      this.shadowGenerator.bias = 0.0005;
    } else {
      this.shadowGenerator.getShadowMap()?.resize(mapSize);
    }
  }

  getShadowQuality(): ShadowQuality {
    return this.shadowQuality;
  }

  /** Registers a mesh to both cast and be a shadow-receiving surface. */
  registerCaster(mesh: Parameters<ShadowGenerator['addShadowCaster']>[0]): void {
    this.shadowGenerator?.addShadowCaster(mesh, true);
  }

  getSunLight(): DirectionalLight {
    return this.sunLight;
  }

  getAmbientLight(): HemisphericLight {
    return this.ambientLight;
  }

  dispose(): void {
    this.shadowGenerator?.dispose();
    this.sunLight.dispose();
    this.ambientLight.dispose();
  }
}
