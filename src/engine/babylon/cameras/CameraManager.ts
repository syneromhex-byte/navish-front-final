import { ArcRotateCamera, UniversalCamera, Vector3 } from '@babylonjs/core';
import type { Camera, Scene } from '@babylonjs/core';
import type { CameraMode } from '@app-types/viewer.types';

const DEFAULT_TARGET = new Vector3(0, 1.2, 0);
const DEFAULT_RADIUS = 12;
const EYE_HEIGHT = 1.7;

export class CameraManager {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private mode: CameraMode = 'orbit';
  private camera: Camera;
  private modelRadius: number = DEFAULT_RADIUS;
  private modelCenter: Vector3 = DEFAULT_TARGET;
  private modelFloorY: number = 0;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
    this.camera = this.createOrbitCamera();
    this.scene.activeCamera = this.camera;
    this.camera.attachControl(canvas, true);
  }

  getActiveCamera(): Camera {
    return this.camera;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  getModelCenter(): Vector3 {
    return this.modelCenter.clone();
  }

  getModelFloorY(): number {
    return this.modelFloorY;
  }

  setMode(mode: CameraMode): void {
    if (mode === this.mode) return;

    const { position, target } = this.captureTransform();
    this.camera.detachControl();
    this.camera.dispose();

    switch (mode) {
      case 'orbit':
        this.camera = this.createOrbitCamera(position, target);
        break;
      case 'firstPerson':
      case 'walk': {
        const spawnPoint = this.getInteriorSpawnPoint();
        const lookTarget = spawnPoint.add(new Vector3(0, 0, 1));
        this.camera = this.createGroundedCamera(
          mode === 'walk' ? 'walkCamera' : 'fpsCamera',
          spawnPoint,
          lookTarget,
        );
        break;
      }
      case 'fly':
        this.camera = this.createFreeCamera(position, target);
        break;
      case 'cinematic':
        this.camera = this.createCinematicCamera(target);
        break;
    }

    this.mode = mode;
    this.scene.activeCamera = this.camera;
    
    // Dynamically apply limits based on current model scale
    this.applyCameraBounds();

    this.camera.attachControl(this.canvas, true);
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();
  }

  /** Frames the camera to comfortably view a bounding sphere. */
  frameBounds(center: Vector3, radius: number, floorY?: number): void {
    this.modelCenter = center.clone();
    this.modelRadius = radius;
    this.modelFloorY = floorY !== undefined ? floorY : center.y - radius * 0.5;

    if (this.camera instanceof ArcRotateCamera) {
      this.camera.target = center;
      this.camera.radius = Math.max(radius * 2.2, 3);
    } else {
      this.camera.position = center.add(new Vector3(radius * 1.5, EYE_HEIGHT, radius * 1.5));
      if ('setTarget' in this.camera) {
        (this.camera as UniversalCamera).setTarget(center);
      }
    }

    this.applyCameraBounds();
  }

  private applyCameraBounds(): void {
    const radius = this.modelRadius;
    const center = this.modelCenter;

    if (this.camera instanceof ArcRotateCamera) {
      this.camera.target = center;
      this.camera.minZ = Math.max(0.01, radius * 0.001);
      this.camera.maxZ = Math.max(10000, radius * 20);

      if (this.mode !== 'cinematic') {
        this.camera.lowerRadiusLimit = radius * 0.2;
        this.camera.upperRadiusLimit = radius * 10;
      } else {
        const targetRadius = Math.max(radius * 1.5, 3);
        this.camera.radius = targetRadius;
        this.camera.lowerRadiusLimit = targetRadius;
        this.camera.upperRadiusLimit = targetRadius;
      }
    } else {
      const universalCamera = this.camera as UniversalCamera;
      universalCamera.minZ = Math.max(0.01, radius * 0.001);
      universalCamera.maxZ = Math.max(10000, radius * 20);

      if (this.mode === 'fly') {
        universalCamera.speed = Math.max(0.2, radius * 0.05);
      } else {
        universalCamera.speed = Math.max(0.1, radius * 0.035);
      }
    }
  }

  /**
   * Returns a spawn position guaranteed to be inside the room interior at eye level (~1.7m).
   */
  getInteriorSpawnPoint(): Vector3 {
    const eyeHeightPos = this.modelFloorY + EYE_HEIGHT;
    return new Vector3(this.modelCenter.x, eyeHeightPos, this.modelCenter.z);
  }

  private captureTransform(): { position: Vector3; target: Vector3 } {
    if (this.camera instanceof ArcRotateCamera) {
      return { position: this.camera.position.clone(), target: this.camera.target.clone() };
    }
    const universalCamera = this.camera as UniversalCamera;
    return {
      position: universalCamera.position.clone(),
      target: universalCamera.getTarget().clone(),
    };
  }

  private createOrbitCamera(position?: Vector3, target: Vector3 = DEFAULT_TARGET): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'orbitCamera',
      -Math.PI / 2,
      Math.PI / 2.5,
      position ? Vector3.Distance(position, target) : DEFAULT_RADIUS,
      target,
      this.scene,
    );
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 60;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 25;
    camera.panningSensibility = 800;
    camera.pinchPrecision = 80;
    camera.inertia = 0.85;
    camera.minZ = 0.1;
    return camera;
  }

  private createGroundedCamera(
    name: string,
    position?: Vector3,
    target: Vector3 = DEFAULT_TARGET,
  ): UniversalCamera {
    const eyePos = position ?? this.getInteriorSpawnPoint();
    const camera = new UniversalCamera(name, eyePos, this.scene);
    camera.applyGravity = true;
    camera.needMoveForGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.4, EYE_HEIGHT / 2, 0.4);
    camera.minZ = 0.05;
    camera.speed = 1.0; 
    camera.angularSensibility = 1000;
    camera.keysUp = [87, 38]; // W, Up Arrow
    camera.keysDown = [83, 40]; // S, Down Arrow
    camera.keysLeft = [65, 37]; // A, Left Arrow
    camera.keysRight = [68, 39]; // D, Right Arrow
    camera.setTarget(target);

    const minGroundY = this.modelFloorY + EYE_HEIGHT;
    const clampObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (camera.position.y < minGroundY) {
        camera.position.y = minGroundY;
      }
    });
    camera.onDisposeObservable.addOnce(() => {
      this.scene.onBeforeRenderObservable.remove(clampObserver);
    });

    return camera;
  }

  private createFreeCamera(position?: Vector3, target: Vector3 = DEFAULT_TARGET): UniversalCamera {
    const camera = new UniversalCamera(
      'flyCamera',
      position ?? target.add(new Vector3(0, 3, -DEFAULT_RADIUS)),
      this.scene,
    );
    camera.applyGravity = false;
    camera.checkCollisions = false;
    camera.minZ = 0.05;
    // Increased speed for faster movement
    camera.speed = 1.5; 
    camera.angularSensibility = 1000;
    camera.keysUp = [87, 38];
    camera.keysDown = [83, 40];
    camera.keysLeft = [65, 37];
    camera.keysRight = [68, 39];
    camera.keysUpward = [69];
    camera.keysDownward = [81];
    camera.setTarget(target);
    return camera;
  }

  private createCinematicCamera(target: Vector3 = DEFAULT_TARGET): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'cinematicCamera',
      -Math.PI / 2,
      Math.PI / 2.6,
      DEFAULT_RADIUS * 1.3,
      target,
      this.scene,
    );
    camera.lowerRadiusLimit = camera.radius;
    camera.upperRadiusLimit = camera.radius;
    camera.minZ = 0.1;
    camera.useAutoRotationBehavior = true;
    if (camera.autoRotationBehavior) {
      camera.autoRotationBehavior.idleRotationSpeed = 0.15;
      camera.autoRotationBehavior.idleRotationWaitTime = 0;
      camera.autoRotationBehavior.idleRotationSpinupTime = 2000;
    }
    return camera;
  }

  dispose(): void {
    this.camera.detachControl();
    this.camera.dispose();
  }
}
