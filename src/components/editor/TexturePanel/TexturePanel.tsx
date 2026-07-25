import { cn } from '@utils/cn';
import type { ProceduralTextureKind } from '@engine/babylon/TextureManager';

export interface TexturePanelProps {
  isEnabled: boolean;
  hasTexture: boolean;
  onApply: (kind: ProceduralTextureKind) => void;
  onClear: () => void;
}

const PRESETS: { kind: ProceduralTextureKind; label: string; swatchClass: string }[] = [
  { kind: 'wood', label: 'Wood', swatchClass: 'bg-gradient-to-br from-[#8a5a34] to-[#5c3a1e]' },
  { kind: 'marble', label: 'Marble', swatchClass: 'bg-gradient-to-br from-[#e8e6e1] to-[#b9b5ac]' },
  { kind: 'brick', label: 'Brick', swatchClass: 'bg-gradient-to-br from-[#a14b3c] to-[#6e2f24]' },
  { kind: 'grass', label: 'Grass', swatchClass: 'bg-gradient-to-br from-[#5f8a4a] to-[#33501f]' },
];

export function TexturePanel({ isEnabled, hasTexture, onApply, onClear }: TexturePanelProps) {
  if (!isEnabled) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-tertiary">Select an object to apply a texture.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-2.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.kind}
            type="button"
            onClick={() => onApply(preset.kind)}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle p-2 transition-colors hover:border-border-strong"
          >
            <span className={cn('h-12 w-full rounded-lg', preset.swatchClass)} />
            <span className="text-xs text-text-secondary group-hover:text-text-primary">
              {preset.label}
            </span>
          </button>
        ))}
      </div>

      {hasTexture && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
        >
          Remove Texture
        </button>
      )}
    </div>
  );
}
