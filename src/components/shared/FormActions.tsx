import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  submitDisabled?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export function FormActions({
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  onCancel,
  isLoading = false,
  submitDisabled = false,
  extraActions,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border mt-6',
        className
      )}
    >
      <div>{extraActions}</div>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={submitDisabled || isLoading}
          className="w-full sm:w-auto min-w-[100px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </span>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}

