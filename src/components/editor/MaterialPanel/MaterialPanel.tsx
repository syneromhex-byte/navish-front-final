import { ColorPicker, Slider } from '@components/common';
import type { MaterialProperties } from '@engine/babylon/MaterialManager';

export interface MaterialPanelProps {
  properties: MaterialProperties | null;
  onChange: (update: Partial<MaterialProperties>) => void;
}

export function MaterialPanel({ properties, onChange }: MaterialPanelProps) {
  if (!properties) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-tertiary">Select an object to edit its material.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <ColorPicker
        label="Base Color"
        value={properties.albedoColor}
        onChange={(hex) => onChange({ albedoColor: hex })}
      />
      <Slider
        label="Metallic"
        min={0}
        max={1}
        step={0.01}
        value={properties.metallic}
        onChange={(value) => onChange({ metallic: value })}
      />
      <Slider
        label="Roughness"
        min={0}
        max={1}
        step={0.01}
        value={properties.roughness}
        onChange={(value) => onChange({ roughness: value })}
      />
    </div>
  );
}
