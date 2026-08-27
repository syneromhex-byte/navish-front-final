import { Vector3, WebXRFeatureName, WebXRSessionManager, WebXRState } from '@babylonjs/core';
import type { AbstractMesh, Camera, Scene, WebXRDefaultExperience } from '@babylonjs/core';

export class VRManager {
  private scene: Scene;
  private xrHelper: WebXRDefaultExperience | null = null;
  private onStateChange: ((isInVR: boolean) => void) | null = null;
  private savedCameraPosition: Vector3 | null = null;
  private nonVRCamera: Camera | null = null;
  private fallbackToLocal: boolean = false;

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
      disableDefaultUI: true,
    });

    // Enable Fixed Foveated Rendering (FFR) for Quest & WebXR headsets
    try {
      this.xrHelper.baseExperience.featuresManager.enableFeature(
        (WebXRFeatureName as any).FIXED_FOVEATED_RENDERING || 'xr-fixed-foveated-rendering',
        'latest',
        { foveation: 1.0 },
        true,
        false, // Mark as optional feature so requestSession does not fail with invalid required features
      );
    } catch {
      // Graceful fallback if FFR extension is not supported by headset/browser
    }

    if (this.xrHelper.teleportation && blockerMeshes.length > 0) {
      blockerMeshes.forEach((mesh) => {
        this.xrHelper?.teleportation.addBlockerMesh(mesh);
      });
    }

    // Let the room be walked with the thumbstick (not just teleported around),
    // and keep it wall-aware like the desktop walk camera so movement can't clip through walls.
    const xrCamera = this.xrHelper.baseExperience.camera;
    xrCamera.checkCollisions = true;
    xrCamera.ellipsoid = new Vector3(0.4, 0.85, 0.4);

    try {
      this.xrHelper.baseExperience.featuresManager.enableFeature(
        WebXRFeatureName.MOVEMENT,
        'latest',
        {
          xrInput: this.xrHelper.input,
          movementSpeed: 0.2,
          rotationSpeed: 0.3,
          movementOrientationFollowsViewerPose: true,
          movementOrientationFollowsController: false,
        },
        true,
        false, // Mark as optional feature so requestSession does not fail with invalid required features
      );
    } catch {
      // Continuous thumbstick movement not supported by this headset/browser — teleportation still works.
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
    if (!this.xrHelper) {
      throw new Error('VR session is not ready yet — the scene has not finished initializing WebXR.');
    }
    if (this.scene.activeCamera && !this.isInVR()) {
      this.nonVRCamera = this.scene.activeCamera;
      this.savedCameraPosition = this.scene.activeCamera.position.clone();
    }

    try {
      await this.xrHelper.baseExperience.enterXRAsync('immersive-vr', 'local-floor');
    } catch {
      await this.xrHelper.baseExperience.enterXRAsync('immersive-vr', 'local');
    }
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
