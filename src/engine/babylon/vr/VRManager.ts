import { WebXRSessionManager, WebXRState } from '@babylonjs/core';
import type { AbstractMesh, Scene, WebXRDefaultExperience } from '@babylonjs/core';

export class VRManager {
  private scene: Scene;
  private xrHelper: WebXRDefaultExperience | null = null;
  private onStateChange: ((isInVR: boolean) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  static async isSupported(): Promise<boolean> {
    try {
      return await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr');
    } catch {
      return false;
    }
  }

  /** Sets up WebXR with teleportation against the given floor meshes. Call once the scene has real geometry. */
  async initialize(floorMeshes: AbstractMesh[]): Promise<boolean> {
    const supported = await VRManager.isSupported();
    if (!supported) return false;

    this.xrHelper = await this.scene.createDefaultXRExperienceAsync({
      floorMeshes,
      optionalFeatures: true,
    });

    this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      this.onStateChange?.(state === WebXRState.IN_XR);
    });

    return true;
  }

  onVRStateChange(callback: (isInVR: boolean) => void): void {
    this.onStateChange = callback;
  }

  async enterVR(): Promise<void> {
    await this.xrHelper?.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
  }

  async exitVR(): Promise<void> {
    await this.xrHelper?.baseExperience.exitXRAsync();
  }

  isInVR(): boolean {
    return this.xrHelper?.baseExperience.state === WebXRState.IN_XR;
  }

  setTeleportationEnabled(enabled: boolean): void {
    const teleportation = this.xrHelper?.teleportation;
    if (!teleportation) return;
    if (enabled) {
      teleportation.attach();
    } else {
      teleportation.detach();
    }
  }

  dispose(): void {
    this.xrHelper?.dispose();
  }
}
