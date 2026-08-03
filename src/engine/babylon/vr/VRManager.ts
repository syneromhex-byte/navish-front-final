import { Vector3, WebXRSessionManager, WebXRState } from '@babylonjs/core';
import type { AbstractMesh, Camera, Scene, WebXRDefaultExperience } from '@babylonjs/core';

export class VRManager {
  private scene: Scene;
  private xrHelper: WebXRDefaultExperience | null = null;
  private onStateChange: ((isInVR: boolean) => void) | null = null;
  private savedCameraPosition: Vector3 | null = null;
  private nonVRCamera: Camera | null = null;

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

  /** Sets up WebXR with teleportation against floor meshes and wall blocker meshes. */
  async initialize(floorMeshes: AbstractMesh[], blockerMeshes: AbstractMesh[] = []): Promise<boolean> {
    const supported = await VRManager.isSupported();
    if (!supported) return false;

    this.xrHelper = await this.scene.createDefaultXRExperienceAsync({
      floorMeshes,
      optionalFeatures: true,
    });

    if (this.xrHelper.teleportation && blockerMeshes.length > 0) {
      blockerMeshes.forEach((mesh) => {
        this.xrHelper?.teleportation.addBlockerMesh(mesh);
      });
    }

    this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      const isInXR = state === WebXRState.IN_XR;
      if (isInXR && this.xrHelper) {
        const xrCamera = this.xrHelper.baseExperience.camera;
        if (this.nonVRCamera && typeof xrCamera.setTransformationFromNonVRCamera === 'function') {
          xrCamera.setTransformationFromNonVRCamera(this.nonVRCamera);
        } else if (this.savedCameraPosition) {
          xrCamera.position.copyFrom(this.savedCameraPosition);
        }
      }
      this.onStateChange?.(isInXR);
    });

    return true;
  }

  onVRStateChange(callback: (isInVR: boolean) => void): void {
    this.onStateChange = callback;
  }

  async enterVR(): Promise<void> {
    if (this.scene.activeCamera && !this.isInVR()) {
      this.nonVRCamera = this.scene.activeCamera;
      this.savedCameraPosition = this.scene.activeCamera.position.clone();
    }
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

