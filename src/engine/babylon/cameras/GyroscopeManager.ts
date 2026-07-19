import { ArcRotateCamera, UniversalCamera } from '@babylonjs/core';
import type { Observer, Scene } from '@babylonjs/core';

interface Orientation {
  alpha: number;
  beta: number;
}

/** iOS 13+ gates DeviceOrientationEvent behind an explicit user-gesture permission prompt. */
interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

function shortestDelta(current: number, reference: number): number {
  let delta = current - reference;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/**
 * Maps phone rotation (deviceorientation) onto the active camera's look
 * direction: alpha (compass heading) → yaw, beta (front/back tilt) → pitch.
 * Works against whatever camera is active rather than owning its own, so it
 * composes with walk/fly/first-person mode instead of replacing it.
 */
export class GyroscopeManager {
  private scene: Scene;
  private isEnabled = false;
  private sensitivity = 1;
  private calibration: Orientation = { alpha: 0, beta: 0 };
  private latest: Orientation = { alpha: 0, beta: 0 };

  // --- Orbit auto-look: passive device-tilt look for the default
  // touch-orbit camera. Fully separate from the explicit Walk/Fly/First
  // Person "Motion Look" toggle above — it only ever touches
  // ArcRotateCamera.alpha/beta as small incremental nudges, so it composes
  // with the existing pointer/touch rotate-zoom-pan input instead of
  // fighting it, and never runs while a UniversalCamera is active.
  private orbitIsEnabled = false;
  private orbitLastReading: Orientation | null = null;
  private orbitPendingAlpha = 0;
  private orbitPendingBeta = 0;
  private orbitDamping = 0.12;
  private orbitRenderObserver: Observer<Scene> | null = null;
  private orbitFirstTouchCanvas: HTMLCanvasElement | null = null;
  private orbitFirstTouchListener: (() => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  static isAvailable(): boolean {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  static async requestPermission(): Promise<boolean> {
    const DeviceOrientationEventCtor = window.DeviceOrientationEvent as unknown as
      (typeof DeviceOrientationEvent & DeviceOrientationEventWithPermission) | undefined;

    if (typeof DeviceOrientationEventCtor?.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEventCtor.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    // Android and desktop browsers don't gate the API behind a permission prompt.
    return true;
  }

  enable(): void {
    if (this.isEnabled) return;
    window.addEventListener('deviceorientation', this.handleOrientation);
    this.isEnabled = true;
  }

  disable(): void {
    window.removeEventListener('deviceorientation', this.handleOrientation);
    this.isEnabled = false;
  }

  /** Zeroes the current phone orientation as "look forward". */
  calibrate(): void {
    this.calibration = { ...this.latest };
  }

  setSensitivity(value: number): void {
    this.sensitivity = value;
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Auto-starts phone-tilt camera look for the default orbit camera. Adds
   * no UI: on iOS (which requires a user-gesture-triggered permission
   * prompt) it silently requests permission on the visitor's first touch of
   * the canvas — the same first touch already needed to use the existing
   * touch controls — and simply does nothing further if that's denied or
   * the device has no orientation sensors, leaving touch rotate/zoom/pan
   * completely untouched either way. Safe to call once per viewer session.
   */
  enableOrbitAutoLook(canvas: HTMLCanvasElement): void {
    if (this.orbitIsEnabled || !GyroscopeManager.isAvailable()) return;

    const DeviceOrientationEventCtor = window.DeviceOrientationEvent as unknown as
      (typeof DeviceOrientationEvent & DeviceOrientationEventWithPermission) | undefined;
    const needsPermission = typeof DeviceOrientationEventCtor?.requestPermission === 'function';

    if (!needsPermission) {
      this.startOrbitAutoLook();
      return;
    }

    this.orbitFirstTouchCanvas = canvas;
    this.orbitFirstTouchListener = () => {
      this.detachOrbitFirstTouchListener();
      GyroscopeManager.requestPermission()
        .then((granted) => {
          if (granted) this.startOrbitAutoLook();
        })
        .catch(() => {});
    };
    canvas.addEventListener('pointerdown', this.orbitFirstTouchListener, { once: true });
  }

  disableOrbitAutoLook(): void {
    this.detachOrbitFirstTouchListener();
    window.removeEventListener('deviceorientation', this.handleOrbitOrientation);
    if (this.orbitRenderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.orbitRenderObserver);
      this.orbitRenderObserver = null;
    }
    this.orbitIsEnabled = false;
    this.orbitLastReading = null;
    this.orbitPendingAlpha = 0;
    this.orbitPendingBeta = 0;
  }

  private detachOrbitFirstTouchListener(): void {
    if (this.orbitFirstTouchCanvas && this.orbitFirstTouchListener) {
      this.orbitFirstTouchCanvas.removeEventListener('pointerdown', this.orbitFirstTouchListener);
    }
    this.orbitFirstTouchCanvas = null;
    this.orbitFirstTouchListener = null;
  }

  private startOrbitAutoLook(): void {
    if (this.orbitIsEnabled) return;
    this.orbitIsEnabled = true;
    window.addEventListener('deviceorientation', this.handleOrbitOrientation);
    this.orbitRenderObserver = this.scene.onBeforeRenderObservable.add(() => this.stepOrbitAutoLook());
  }

  private handleOrbitOrientation = (event: DeviceOrientationEvent): void => {
    if (event.alpha === null || event.beta === null) return;
    const alpha = event.alpha;
    const beta = event.beta;

    if (!this.orbitLastReading) {
      this.orbitLastReading = { alpha, beta };
      return;
    }

    const deltaAlphaDeg = shortestDelta(alpha, this.orbitLastReading.alpha);
    const deltaBetaDeg = beta - this.orbitLastReading.beta;
    this.orbitLastReading = { alpha, beta };

    // Orbit camera yaw runs opposite to compass heading, so flip alpha.
    this.orbitPendingAlpha += (-deltaAlphaDeg * Math.PI * this.sensitivity) / 180;
    this.orbitPendingBeta += (deltaBetaDeg * Math.PI * this.sensitivity) / 180;
  };

  private stepOrbitAutoLook(): void {
    const camera = this.scene.activeCamera;
    if (!(camera instanceof ArcRotateCamera)) return;

    const applyAlpha = this.orbitPendingAlpha * this.orbitDamping;
    const applyBeta = this.orbitPendingBeta * this.orbitDamping;
    if (applyAlpha === 0 && applyBeta === 0) return;

    const lowerBeta = camera.lowerBetaLimit ?? 0.01;
    const upperBeta = camera.upperBetaLimit ?? Math.PI - 0.01;

    camera.alpha += applyAlpha;
    camera.beta = Math.min(upperBeta, Math.max(lowerBeta, camera.beta + applyBeta));

    this.orbitPendingAlpha -= applyAlpha;
    this.orbitPendingBeta -= applyBeta;
  }

  private handleOrientation = (event: DeviceOrientationEvent): void => {
    const alpha = event.alpha ?? 0;
    const beta = event.beta ?? 0;
    this.latest = { alpha, beta };

    const camera = this.scene.activeCamera;
    if (!(camera instanceof UniversalCamera)) return;

    const deltaAlpha = shortestDelta(alpha, this.calibration.alpha) * this.sensitivity;
    const deltaBeta = (beta - this.calibration.beta) * this.sensitivity;

    camera.rotation.y = (deltaAlpha * Math.PI) / 180;
    camera.rotation.x = (-deltaBeta * Math.PI) / 180;
  };

  dispose(): void {
    this.disable();
    this.disableOrbitAutoLook();
  }
}
