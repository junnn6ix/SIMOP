'use client';

import * as React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JadwalFormDialog, PegawaiOption } from './JadwalFormDialog';

export interface JadwalHeaderActionsProps {
  pegawaiOptions: PegawaiOption[];
}

export function JadwalHeaderActions({ pegawaiOptions }: JadwalHeaderActionsProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <CalendarPlus className="h-4 w-4" />
        <span>Buat Penugasan Baru</span>
      </Button>
      <JadwalFormDialog
        open={open}
        onOpenChange={setOpen}
        pegawaiOptions={pegawaiOptions}
      />
    </>
  );
}

