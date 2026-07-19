export const VIEWER_CONFIG = {
  defaultCameraMode: 'orbit' as const, // 'orbit' | 'walk' | 'cinematic'
  gyroscope: {
    defaultSensitivity: 1.0,
    minSensitivity: 0.1,
    maxSensitivity: 3.0,
  },
  geoWalk: {
    updateIntervalMs: 1000,
    movementThresholdMeters: 0.5,
  },
  optimization: {
    targetFps: 60,
    autoOptimizeIntervalMs: 500,
  },
};
