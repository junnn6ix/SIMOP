'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PegawaiFormDialog } from './PegawaiFormDialog';

export function PegawaiHeaderActions() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        <span>Tambah Pegawai</span>
      </Button>
      <PegawaiFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

