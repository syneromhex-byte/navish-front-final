import { useRef, useState } from 'react';
import { cn } from '@utils/cn';
import type { ProceduralTextureKind } from '@engine/babylon/TextureManager';

export interface TexturePanelProps {
  isEnabled: boolean;
  hasTexture: boolean;
  onApply: (kind: ProceduralTextureKind) => void;
  onUploadFile?: (file: File) => void;
  onTilingChange?: (uScale: number, vScale: number) => void;
  onClear: () => void;
}

const PRESETS: { kind: ProceduralTextureKind; label: string; swatchClass: string }[] = [
  { kind: 'wood', label: 'Wood', swatchClass: 'bg-gradient-to-br from-[#8a5a34] to-[#5c3a1e]' },
  { kind: 'marble', label: 'Marble', swatchClass: 'bg-gradient-to-br from-[#e8e6e1] to-[#b9b5ac]' },
  { kind: 'brick', label: 'Brick', swatchClass: 'bg-gradient-to-br from-[#a14b3c] to-[#6e2f24]' },
  { kind: 'grass', label: 'Grass', swatchClass: 'bg-gradient-to-br from-[#5f8a4a] to-[#33501f]' },
];

export function TexturePanel({
  isEnabled,
  hasTexture,
  onApply,
  onUploadFile,
  onTilingChange,
  onClear,
}: TexturePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uScale, setUScale] = useState(4);
  const [vScale, setVScale] = useState(4);

  if (!isEnabled) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-tertiary">Select an object to apply or edit texture.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleUScaleChange = (val: number) => {
    setUScale(val);
    if (onTilingChange) onTilingChange(val, vScale);
  };

  const handleVScaleChange = (val: number) => {
    setVScale(val);
    if (onTilingChange) onTilingChange(uScale, val);
  };

  return (
    <div className="flex flex-col gap-3.5 p-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Custom Image Texture
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle p-3 text-xs font-medium text-text-secondary transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Upload Image (.png, .jpg)
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Preset Textures
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.kind}
              type="button"
              onClick={() => onApply(preset.kind)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle p-2 transition-colors hover:border-border-strong"
            >
              <span className={cn('h-10 w-full rounded-lg shadow-inner', preset.swatchClass)} />
              <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasTexture && (
        <div className="flex flex-col gap-2.5 rounded-xl bg-surface-1/40 p-2.5 border border-border-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Texture Tiling (Scale)
          </p>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-secondary">Scale U:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={uScale}
              onChange={(e) => handleUScaleChange(Number(e.target.value))}
              className="h-1.5 flex-1 rounded-lg appearance-none bg-surface-2 accent-primary"
            />
            <span className="w-5 text-right font-mono text-text-primary">{uScale}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-secondary">Scale V:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={vScale}
              onChange={(e) => handleVScaleChange(Number(e.target.value))}
              className="h-1.5 flex-1 rounded-lg appearance-none bg-surface-2 accent-primary"
            />
            <span className="w-5 text-right font-mono text-text-primary">{vScale}</span>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Remove Texture
          </button>
        </div>
      )}
    </div>
  );
}
