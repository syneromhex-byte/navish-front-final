import { Button, Slider } from '@components/common';
import { GeoWalkManager } from '@engine/babylon/GeoWalkManager';
import type { GeoWalkStatus } from '@engine/babylon/GeoWalkManager';

export interface CameraControlsProps {
  isGyroActive: boolean;
  sensitivity: number;
  onToggleGyro: () => void;
  onCalibrate: () => void;
  onSensitivityChange: (value: number) => void;
  isGeoWalkAvailable: boolean;
  geoWalkStatus: GeoWalkStatus | null;
  onToggleGeoWalk: () => void;
  onRecalibrateGeoWalk: () => void;
}

export function CameraControls({
  isGyroActive,
  sensitivity,
  onToggleGyro,
  onCalibrate,
  onSensitivityChange,
  isGeoWalkAvailable,
  geoWalkStatus,
  onToggleGeoWalk,
  onRecalibrateGeoWalk,
}: CameraControlsProps) {
  const isGeoWalkActive = geoWalkStatus?.isEnabled ?? false;

  return (
    <div className="glass-panel absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col gap-3 rounded-2xl p-3 sm:w-72">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">Motion Look</p>
        <Button variant={isGyroActive ? 'primary' : 'secondary'} size="sm" onClick={onToggleGyro}>
          {isGyroActive ? 'On' : 'Off'}
        </Button>
      </div>

      {isGyroActive && (
        <>
          <Slider
            label="Sensitivity"
            min={0.2}
            max={2}
            step={0.05}
            value={sensitivity}
            onChange={onSensitivityChange}
          />
          <Button variant="outline" size="sm" onClick={onCalibrate}>
            Calibrate (reset forward)
          </Button>
        </>
      )}

      {isGeoWalkAvailable && (
        <>
          <div className="h-px bg-border-subtle" />

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-primary">GPS Walk</p>
            <Button
              variant={isGeoWalkActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={onToggleGeoWalk}
            >
              {isGeoWalkActive ? 'On' : 'Off'}
            </Button>
          </div>

          {!GeoWalkManager.isSecureContext() && (
            <p className="text-xs text-primary">
              Needs https:// or localhost — GPS is blocked on this connection.
            </p>
          )}

          {isGeoWalkActive && (
            <>
              <p className="text-xs text-text-tertiary">
                Walking moves the camera the same real-world distance and direction. Best
                outdoors — GPS accuracy is limited indoors.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  {geoWalkStatus?.isCalibrated ? 'Calibrated' : 'Waiting for GPS fix…'}
                </span>
                {geoWalkStatus?.accuracyMeters != null && (
                  <span className="tabular text-text-tertiary">
                    ±{Math.round(geoWalkStatus.accuracyMeters)}m accuracy
                  </span>
                )}
              </div>
              {geoWalkStatus?.lastError && (
                <p className="text-xs text-primary">{geoWalkStatus.lastError}</p>
              )}
              <Button variant="outline" size="sm" onClick={onRecalibrateGeoWalk}>
                Recalibrate (I&apos;m standing here)
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
