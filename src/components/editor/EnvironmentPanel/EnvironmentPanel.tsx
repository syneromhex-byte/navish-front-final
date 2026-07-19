import { Slider } from '@components/common';
import { cn } from '@utils/cn';

export interface EnvironmentPanelProps {
  turbidity: number;
  luminance: number;
  fogEnabled: boolean;
  fogDensity: number;
  onTurbidityChange: (value: number) => void;
  onLuminanceChange: (value: number) => void;
  onFogToggle: (enabled: boolean) => void;
  onFogDensityChange: (value: number) => void;
}

export function EnvironmentPanel({
  turbidity,
  luminance,
  fogEnabled,
  fogDensity,
  onTurbidityChange,
  onLuminanceChange,
  onFogToggle,
  onFogDensityChange,
}: EnvironmentPanelProps) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <p className="text-xs font-medium text-text-secondary">Sky</p>
        <div className="mt-2 flex flex-col gap-3">
          <Slider
            label="Turbidity (haze)"
            min={1}
            max={20}
            step={0.5}
            value={turbidity}
            onChange={onTurbidityChange}
          />
          <Slider
            label="Luminance"
            min={0.1}
            max={1.2}
            step={0.05}
            value={luminance}
            onChange={onLuminanceChange}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-secondary">Fog</p>
          <button
            type="button"
            role="switch"
            aria-checked={fogEnabled}
            onClick={() => onFogToggle(!fogEnabled)}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              fogEnabled ? 'bg-primary' : 'bg-white/15',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                fogEnabled ? 'translate-x-[18px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
        {fogEnabled && (
          <Slider
            className="mt-3"
            label="Density"
            min={0.001}
            max={0.05}
            step={0.001}
            value={fogDensity}
            formatValue={(v) => v.toFixed(3)}
            onChange={onFogDensityChange}
          />
        )}
      </div>
    </div>
  );
}
