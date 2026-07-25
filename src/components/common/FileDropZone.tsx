import { useCallback, useRef, useState } from 'react';
import { cn } from '@utils/cn';
import { SUPPORTED_MODEL_EXTENSIONS, SUPPORTED_FORMATS_LABEL, MAX_UPLOAD_SIZE_BYTES } from '@utils/pickPrimaryModelFile';
import { formatBytes } from '@utils/format';

export interface FileDropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  onError?: (message: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FileDropZone({
  onFilesAccepted,
  onError,
  accept,
  maxSizeBytes = MAX_UPLOAD_SIZE_BYTES,
  multiple = true,
  className,
  disabled = false,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptExtensions = accept
    ? accept.split(',').map((e) => e.trim().toLowerCase())
    : SUPPORTED_MODEL_EXTENSIONS.map((ext) => ext.toLowerCase());

  const validate = useCallback(
    (files: File[]): string | null => {
      if (files.length === 0) return 'No files selected.';

      for (const file of files) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const isModel = acceptExtensions.some((a) => ext === a || file.name.toLowerCase().endsWith(a));
        // Allow sibling files (.bin, .png, .jpg, etc.) if multiple
        if (!multiple && !isModel) {
          return `Unsupported format: ${file.name}. Supported: ${SUPPORTED_FORMATS_LABEL}`;
        }
        if (file.size > maxSizeBytes) {
          return `${file.name} exceeds the maximum file size of ${formatBytes(maxSizeBytes)}.`;
        }
      }

      // At least one must be a model file
      const hasModel = files.some((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return SUPPORTED_MODEL_EXTENSIONS.some((supported) => ext === supported);
      });
      if (!hasModel) {
        return `Please select a model file. Supported: ${SUPPORTED_FORMATS_LABEL}`;
      }

      return null;
    },
    [acceptExtensions, maxSizeBytes, multiple],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList);
      const error = validate(files);
      if (error) {
        setLocalError(error);
        onError?.(error);
        return;
      }
      setLocalError(null);
      onFilesAccepted(files);
    },
    [validate, onFilesAccepted, onError],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200',
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border-subtle hover:border-primary/50 hover:bg-white/[0.02]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {/* Upload icon */}
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
            isDragOver ? 'bg-primary/15 text-primary' : 'bg-white/[0.06] text-text-tertiary group-hover:text-primary',
          )}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {isDragOver ? 'Drop files here' : 'Drag & drop your model here'}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            or <span className="text-primary">browse files</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
          <span>Supported: {SUPPORTED_FORMATS_LABEL}</span>
          <span>Max: {formatBytes(maxSizeBytes)}</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptExtensions.join(',')}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {localError && (
        <p className="text-xs text-primary">{localError}</p>
      )}
    </div>
  );
}
