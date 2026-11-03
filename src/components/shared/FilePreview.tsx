'use client';

import * as React from 'react';
import { Download, ExternalLink, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface FilePreviewProps {
  url?: string | null;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'auto';
  thumbnailOnly?: boolean;
  className?: string;
}

export function FilePreview({
  url,
  fileName = 'Berkas Bukti',
  fileType = 'auto',
  thumbnailOnly = false,
  className,
}: FilePreviewProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-btn border border-border bg-muted/40 text-xs text-text-secondary',
          className
        )}
      >
        <FileText className="h-4 w-4 opacity-50" />
        <span>Tidak ada berkas</span>
      </div>
    );
  }

  const isPdf =
    fileType === 'pdf' ||
    (fileType === 'auto' &&
      (url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf')));

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-3 p-2.5 rounded-panel border border-border bg-surface hover:border-text-neutral transition-colors',
          className
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {isPdf ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-error-tint text-error border border-error/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary/10 text-primary border border-primary/20 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={fileName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <ImageIcon className="h-4 w-4 absolute" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {fileName}
            </p>
            <p className="text-[10px] text-text-secondary uppercase font-mono">
              {isPdf ? 'Dokumen PDF' : 'Gambar / Foto'}
            </p>
          </div>
        </div>

        {!thumbnailOnly && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setModalOpen(true)}
              aria-label="Lihat Pratinjau"
              title="Pratinjau"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="inline-flex items-center justify-center h-8 w-8 rounded-btn text-text-secondary hover:text-text-primary hover:bg-muted focus-ring"
              title="Unduh Berkas"
              aria-label="Unduh Berkas"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <DialogTitle className="text-base truncate max-w-md">
              {fileName}
            </DialogTitle>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mr-8 font-medium"
            >
              <span>Buka di tab baru</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </DialogHeader>

          <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto bg-muted/20">
            {isPdf ? (
              <iframe
                src={url}
                title={fileName}
                className="w-full h-[70vh] rounded-btn border border-border"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={fileName}
                className="max-h-[70vh] max-w-full rounded-btn object-contain shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

