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
        this.camera = this.createGroundedCamera(
          'fpsCamera',
          this.groundedSpawnFrom(position, target),
          target,
        );
        break;
      case 'walk':
        this.camera = this.createGroundedCamera(
          'walkCamera',
          this.groundedSpawnFrom(position, target),
          target,
        );
        break;
      case 'fly':
        this.camera = this.createFreeCamera(position, target);
        break;
      case 'cinematic':
        this.camera = this.createCinematicCamera(target);
        break;
    }

    this.mode = mode;
    this.scene.activeCamera = this.camera;
    this.camera.attachControl(this.canvas, true);
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();
  }

  /** Frames the camera to comfortably view a bounding sphere. */
  frameBounds(center: Vector3, radius: number): void {
    if (this.camera instanceof ArcRotateCamera) {
      this.camera.target = center;
      this.camera.radius = Math.max(radius * 2.2, 3);
      this.camera.lowerRadiusLimit = radius * 0.4;
      this.camera.upperRadiusLimit = radius * 8;
    } else {
      this.camera.position = center.add(new Vector3(radius * 1.5, EYE_HEIGHT, radius * 1.5));
      if ('setTarget' in this.camera) {
        (this.camera as UniversalCamera).setTarget(center);
      }
    }
  }

  /**
   * Grounded (walk/first-person) cameras need a spawn point guaranteed to be
   * inside the walkable space. The orbit/cinematic camera we're switching
   * *from* can be orbiting far outside the actual room (e.g. after
   * `frameBounds` frames a wide shot), so blindly reusing its raw position
   * as the walk-camera spawn can drop the player outside the floor
   * entirely. Instead, keep the horizontal direction the previous camera
   * was viewing from (so the switch doesn't feel like a random teleport)
   * but clamp the distance from `target` to a few meters — safely inside
   * any reasonably-sized room or loaded model, generic to whatever content
   * is on screen rather than tuned to one specific scene.
   */
  private groundedSpawnFrom(previousPosition: Vector3, target: Vector3): Vector3 {
    const horizontalOffset = new Vector3(
      previousPosition.x - target.x,
      0,
      previousPosition.z - target.z,
    );
    const distance = horizontalOffset.length();
    const direction = distance > 0.01 ? horizontalOffset.normalize() : new Vector3(0, 0, -1);
    const safeDistance = Math.min(distance, 3);
    const spawn = target.add(direction.scale(safeDistance));
    spawn.y = EYE_HEIGHT;
    return spawn;
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
    const camera = new UniversalCamera(
      name,
      position ?? new Vector3(0, EYE_HEIGHT, -DEFAULT_RADIUS / 2),
      this.scene,
    );
    camera.applyGravity = true;
    // Babylon only runs the gravity/collision update while the camera has
    // active directional input — without this flag, gravity silently never
    // applies while the player is standing still.
    camera.needMoveForGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.4, EYE_HEIGHT / 2, 0.4);
    camera.minZ = 0.05;
    camera.speed = 0.35;
    camera.angularSensibility = 1000;
    camera.keysUp = [87, 38];
    camera.keysDown = [83, 40];
    camera.keysLeft = [65, 37];
    camera.keysRight = [68, 39];
    camera.setTarget(target);

    const groundLevel = EYE_HEIGHT;
    const clampObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (camera.position.y < groundLevel) camera.position.y = groundLevel;
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
    camera.speed = 0.5;
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
