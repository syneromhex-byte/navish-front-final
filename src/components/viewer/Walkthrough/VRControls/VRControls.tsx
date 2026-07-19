import { Button } from '@components/common';

export interface VRControlsProps {
  isSupported: boolean;
  isInVR: boolean;
  teleportEnabled: boolean;
  onEnterVR: () => void;
  onExitVR: () => void;
  onTeleportToggle: (enabled: boolean) => void;
}

export function VRControls({
  isSupported,
  isInVR,
  teleportEnabled,
  onEnterVR,
  onExitVR,
  onTeleportToggle,
}: VRControlsProps) {
  if (!isSupported) {
    return (
      <div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 text-center">
        <p className="text-sm font-medium text-text-primary">VR not available</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Open this page on a WebXR-capable headset (Quest, Pico, Vive) to enter VR.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl p-2">
      {isInVR ? (
        <Button variant="danger" size="md" onClick={onExitVR}>
          Exit VR
        </Button>
      ) : (
        <Button variant="primary" size="md" onClick={onEnterVR}>
          Enter VR
        </Button>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={teleportEnabled}
        onClick={() => onTeleportToggle(!teleportEnabled)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
      >
        Teleport
        <span
          className={
            teleportEnabled ? 'h-2 w-2 rounded-full bg-primary' : 'h-2 w-2 rounded-full bg-white/20'
          }
        />
      </button>
    </div>
  );
}
