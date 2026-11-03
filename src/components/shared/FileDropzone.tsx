'use client';

import * as React from 'react';
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface FileDropzoneProps {
  accept?: string;
  maxSizeMb?: number;
  value?: File | null;
  onChange?: (file: File | null) => void;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeMb = 5,
  value,
  onChange,
  label = 'Tarik berkas ke sini atau klik untuk memilih',
  helperText = 'Format: JPG, PNG, WEBP, atau PDF (maks. 5 MB)',
  error,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateFile = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    onChange?.(file);
  };

  const validateFile = (file: File): boolean => {
    setInternalError(null);
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setInternalError(`Ukuran berkas melebihi batas maksimal ${maxSizeMb} MB`);
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        updateFile(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        updateFile(file);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = '';
    setInternalError(null);
    updateFile(null);
  };

  const displayError = error || internalError;

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="hidden"
      />

      {!value ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center p-6 rounded-card border-2 border-dashed transition-all cursor-pointer text-center select-none focus-ring',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-surface hover:bg-muted/40 hover:border-text-neutral',
            displayError && 'border-error bg-error-tint/30',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-text-primary">
            {label}
          </p>
          <p className="mt-1 text-xs text-text-secondary">{helperText}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-card border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Pratinjau"
                className="h-12 w-12 rounded-btn object-cover border border-border shrink-0"
              />
            ) : value.type === 'application/pdf' ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-error-tint text-error border border-error/20 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-muted text-text-secondary shrink-0">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-text-primary truncate">
                {value.name}
              </p>
              <p className="text-[11px] text-text-secondary font-mono">
                {(value.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            aria-label="Hapus berkas"
            className="text-text-secondary hover:text-error shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {displayError && (
        <p className="text-xs font-medium text-error">{displayError}</p>
      )}
    </div>
  );
}
