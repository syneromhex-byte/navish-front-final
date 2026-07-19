import { Input } from '@components/common';
import type { TransformValues } from '@engine/babylon/TransformManager';

export interface TransformPanelProps {
  values: TransformValues | null;
  onPositionChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  onRotationChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  onScaleChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}

const AXES = ['x', 'y', 'z'] as const;

function AxisRow({
  label,
  values,
  step,
  onChange,
}: {
  label: string;
  values: { x: number; y: number; z: number };
  step: number;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {AXES.map((axis) => (
          <Input
            key={axis}
            type="number"
            step={step}
            value={Number(values[axis].toFixed(2))}
            onChange={(event) => onChange(axis, Number(event.target.value))}
            className="tabular px-2 text-center text-xs"
          />
        ))}
      </div>
    </div>
  );
}

export function TransformPanel({
  values,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: TransformPanelProps) {
  if (!values) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-tertiary">Select an object to transform it.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <AxisRow label="Position" values={values.position} step={0.1} onChange={onPositionChange} />
      <AxisRow label="Rotation (°)" values={values.rotation} step={1} onChange={onRotationChange} />
      <AxisRow label="Scale" values={values.scale} step={0.05} onChange={onScaleChange} />
    </div>
  );
}
