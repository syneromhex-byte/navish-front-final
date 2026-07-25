export const BABYLON_CONFIG = {
  engineOptions: {
    antialias: true,
    adaptToDeviceRatio: true,
    stencil: true,
    powerPreference: 'high-performance' as const,
  },
  shadows: {
    defaultQuality: 'medium' as const, // 'low' | 'medium' | 'high'
    mapResolution: 1024,
  },
  physics: {
    gravity: [0, -9.81, 0] as [number, number, number],
  },
};
