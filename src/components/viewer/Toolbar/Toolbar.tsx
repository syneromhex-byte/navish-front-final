import { Link } from 'react-router-dom';
import { Dropdown } from '@components/common';
import { cn } from '@utils/cn';
import type { CameraMode } from '@app-types/viewer.types';
import type { ToolMode } from '@store/editorStore';

export interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  onCameraDropdownOpenChange?: (isOpen: boolean) => void;
  /** Hides the edit tools (Select/Move/Rotate/Scale), leaving only camera navigation — for viewers who can look but not modify the model. */
  readOnly?: boolean;
  /** Route to this model's VR page — shown as a button when set, so VR is reachable from any viewer (demo, linked, or locally-picked) without needing a separate project card link. */
  vrHref?: string;
}

const TOOLS: { mode: ToolMode; label: string; icon: string }[] = [
  { mode: 'select', label: 'Select', icon: 'M4 4l6 14 2-6 6-2z' },
  { mode: 'move', label: 'Move', icon: 'M10 2v16M2 10h16M5 5l-3 5 3 5M15 5l3 5-3 5' },
  { mode: 'rotate', label: 'Rotate', icon: 'M16 10a6 6 0 1 1-2-4.5M16 3v4h-4' },
  { mode: 'scale', label: 'Scale', icon: 'M3 3h6v2H5v4H3V3zM17 17h-6v-2h4v-4h2v6z' },
];

const CAMERA_MODES: { value: CameraMode; label: string }[] = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'walk', label: 'Walk' },
  { value: 'fly', label: 'Fly' },
  { value: 'firstPerson', label: 'First Person' },
  { value: 'cinematic', label: 'Cinematic' },
];

export function Toolbar({
  toolMode,
  onToolModeChange,
  cameraMode,
  onCameraModeChange,
  onCameraDropdownOpenChange,
  readOnly = false,
  vrHref,
}: ToolbarProps) {
  return (
    <div className="glass-panel absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5">
      {!readOnly &&
        TOOLS.map((tool) => (
          <button
            key={tool.mode}
            type="button"
            title={tool.label}
            onClick={() => onToolModeChange(tool.mode)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              toolMode === tool.mode
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-white/[0.08] hover:text-text-primary',
            )}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d={tool.icon}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}

      {!readOnly && <div className="mx-1 h-6 w-px bg-border-subtle" />}

      <Dropdown
        trigger={
          <button
            type="button"
            className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
          >
            {CAMERA_MODES.find((mode) => mode.value === cameraMode)?.label}
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
        align="right"
        placement="top"
        items={CAMERA_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
        onSelect={(value) => onCameraModeChange(value as CameraMode)}
        onOpenChange={onCameraDropdownOpenChange}
      />

      {vrHref && (
        <>
          <div className="mx-1 h-6 w-px bg-border-subtle" />
          <Link
            to={vrHref}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M2 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3.5l-1.5 2-1.5-2H4a2 2 0 0 1-2-2V7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="10" r="1.4" fill="currentColor" />
              <circle cx="13" cy="10" r="1.4" fill="currentColor" />
            </svg>
            VR
          </Link>
        </>
      )}
    </div>
  );
}
