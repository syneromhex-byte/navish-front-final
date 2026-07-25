import { Dropdown, Slider } from '@components/common';
import type { ShadowQuality } from '@engine/babylon/LightManager';

export interface LightingPanelProps {
  sunAzimuth: number;
  sunElevation: number;
  sunIntensity: number;
  ambientIntensity: number;
  exposure: number;
  shadowQuality: ShadowQuality;
  onSunAzimuthChange: (value: number) => void;
  onSunElevationChange: (value: number) => void;
  onSunIntensityChange: (value: number) => void;
  onAmbientIntensityChange: (value: number) => void;
  onExposureChange: (value: number) => void;
  onShadowQualityChange: (quality: ShadowQuality) => void;
}

const SHADOW_QUALITIES: { value: ShadowQuality; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function LightingPanel({
  sunAzimuth,
  sunElevation,
  sunIntensity,
  ambientIntensity,
  exposure,
  shadowQuality,
  onSunAzimuthChange,
  onSunElevationChange,
  onSunIntensityChange,
  onAmbientIntensityChange,
  onExposureChange,
  onShadowQualityChange,
}: LightingPanelProps) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <p className="text-xs font-medium text-text-secondary">Sun Position</p>
        <div className="mt-2 flex flex-col gap-3">
          <Slider
            label="Azimuth"
            min={0}
            max={360}
            step={1}
            value={sunAzimuth}
            unit="°"
            formatValue={(v) => v.toFixed(0)}
            onChange={onSunAzimuthChange}
          />
          <Slider
            label="Elevation"
            min={0}
            max={90}
            step={1}
            value={sunElevation}
            unit="°"
            formatValue={(v) => v.toFixed(0)}
            onChange={onSunElevationChange}
          />
        </div>
      </div>

      <Slider
        label="Sun Brightness"
        min={0}
        max={8}
        step={0.1}
        value={sunIntensity}
        onChange={onSunIntensityChange}
      />
      <Slider
        label="Ambient Light"
        min={0}
        max={2}
        step={0.05}
        value={ambientIntensity}
        onChange={onAmbientIntensityChange}
      />
      <Slider
        label="Exposure"
        min={0.2}
        max={2.5}
        step={0.05}
        value={exposure}
        onChange={onExposureChange}
      />

      <div>
        <p className="text-xs font-medium text-text-secondary">Shadow Quality</p>
        <Dropdown
          className="mt-1.5"
          trigger={
            <button
              type="button"
              className="flex h-9 w-full items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-primary"
            >
              {SHADOW_QUALITIES.find((q) => q.value === shadowQuality)?.label}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M2 3.5L5 6.5L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          }
          items={SHADOW_QUALITIES.map((q) => ({ value: q.value, label: q.label }))}
          onSelect={(value) => onShadowQualityChange(value as ShadowQuality)}
        />
      </div>
    </div>
  );
}
