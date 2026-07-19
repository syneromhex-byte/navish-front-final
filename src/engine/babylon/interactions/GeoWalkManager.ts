import { UniversalCamera } from '@babylonjs/core';
import type { Scene, Vector3 } from '@babylonjs/core';

export interface GeoWalkStatus {
  isEnabled: boolean;
  isCalibrated: boolean;
  accuracyMeters: number | null;
  lastError: string | null;
}

interface OriginPoint {
  latitude: number;
  longitude: number;
  cameraPosition: Vector3;
  /** Compass heading (deviceorientation alpha) captured at calibration time. */
  headingOffsetDeg: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Great-circle distance between two lat/lng points, in meters. */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Compass bearing (0-360°, 0 = true north) from point 1 to point 2. */
function bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Moves the active camera to mirror the user's real-world walking — GPS for
 * distance/direction, the device compass for aligning "which way is
 * forward" between the physical world and the virtual room.
 *
 * Honest limitation: browser Geolocation is satellite-based, typically
 * accurate to 5-20m outdoors and worse indoors/near buildings. It's precise
 * enough to notice "the user walked toward the far wall" but will jitter
 * for fine room-scale steps — there's no web API for inside-out
 * (camera-based) tracking like ARKit/ARCore. Also requires a secure context
 * (HTTPS or localhost) per the Geolocation API spec.
 */
export class GeoWalkManager {
  private scene: Scene;
  private watchId: number | null = null;
  private origin: OriginPoint | null = null;
  private latestHeading = 0;
  private isOrientationListenerAttached = false;
  private onStatusChange: ((status: GeoWalkStatus) => void) | null = null;
  private status: GeoWalkStatus = {
    isEnabled: false,
    isCalibrated: false,
    accuracyMeters: null,
    lastError: null,
  };

  constructor(scene: Scene) {
    this.scene = scene;
  }

  static isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /** Geolocation is blocked outside secure contexts — a plain http:// LAN address (common when testing from a phone) will silently fail. */
  static isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
  }

  /** iOS Safari 13+ requires an explicit, gesture-triggered grant before `deviceorientation` fires at all. */
  static needsMotionPermission(): boolean {
    return (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
        .requestPermission === 'function'
    );
  }

  onChange(callback: (status: GeoWalkStatus) => void): void {
    this.onStatusChange = callback;
  }

  getStatus(): GeoWalkStatus {
    return this.status;
  }

  /**
   * Must be called synchronously from a user gesture (button click) — iOS's
   * motion-permission prompt only fires when requested inside the original
   * gesture's call stack, not after an intervening `await`.
   */
  async enable(): Promise<void> {
    if (this.watchId !== null) return;
    this.updateStatus({ lastError: null });

    if (!GeoWalkManager.isSecureContext()) {
      this.updateStatus({
        lastError: 'GPS Walk needs a secure connection — open this app over https:// or localhost.',
      });
      return;
    }

    if (GeoWalkManager.needsMotionPermission()) {
      try {
        const permission = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (permission !== 'granted') {
          this.updateStatus({
            lastError: 'Compass access denied — walking direction may be inaccurate.',
          });
        }
      } catch {
        this.updateStatus({ lastError: 'Could not request compass access.' });
      }
    }

    this.attachHeadingListener();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.updateStatus({ lastError: error.message }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    this.updateStatus({ isEnabled: true });
  }

  disable(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.detachHeadingListener();
    this.origin = null;
    this.updateStatus({ isEnabled: false, isCalibrated: false, accuracyMeters: null });
  }

  /** Re-anchors "here" as the walk origin — call once the user is standing where the virtual camera should start. */
  calibrate(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => this.setOrigin(position),
      (error) => this.updateStatus({ lastError: error.message }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  private setOrigin(position: GeolocationPosition): void {
    const camera = this.scene.activeCamera;
    if (!(camera instanceof UniversalCamera)) return;

    this.origin = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      cameraPosition: camera.position.clone(),
      headingOffsetDeg: this.latestHeading,
    };
    this.updateStatus({ isCalibrated: true, accuracyMeters: position.coords.accuracy });
  }

  private handlePosition(position: GeolocationPosition): void {
    this.updateStatus({ accuracyMeters: position.coords.accuracy, lastError: null });

    if (!this.origin) {
      this.setOrigin(position);
      return;
    }

    const camera = this.scene.activeCamera;
    if (!(camera instanceof UniversalCamera)) return;

    const { latitude, longitude } = position.coords;
    const distance = haversineDistance(this.origin.latitude, this.origin.longitude, latitude, longitude);
    const realBearing = bearingBetween(this.origin.latitude, this.origin.longitude, latitude, longitude);

    // Rotate the real-world bearing into the room's coordinate space using
    // the compass-heading offset captured at calibration.
    const virtualBearingRad = toRadians(realBearing - this.origin.headingOffsetDeg);
    const dx = distance * Math.sin(virtualBearingRad);
    const dz = distance * Math.cos(virtualBearingRad);

    camera.position.x = this.origin.cameraPosition.x + dx;
    camera.position.z = this.origin.cameraPosition.z + dz;
  }

  private attachHeadingListener(): void {
    if (this.isOrientationListenerAttached) return;
    window.addEventListener('deviceorientation', this.handleOrientation);
    this.isOrientationListenerAttached = true;
  }

  private detachHeadingListener(): void {
    window.removeEventListener('deviceorientation', this.handleOrientation);
    this.isOrientationListenerAttached = false;
  }

  private handleOrientation = (event: DeviceOrientationEvent): void => {
    if (event.alpha !== null) this.latestHeading = event.alpha;
  };

  private updateStatus(patch: Partial<GeoWalkStatus>): void {
    this.status = { ...this.status, ...patch };
    this.onStatusChange?.(this.status);
  }

  dispose(): void {
    this.disable();
  }
}
