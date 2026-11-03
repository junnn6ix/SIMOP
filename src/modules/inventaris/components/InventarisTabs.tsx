'use client';

import * as React from 'react';
import { Package, History, Ticket } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarangTable, BarangItem } from './BarangTable';
import { StokLogTable, StokLogItem } from './StokLogTable';
import { TiketAdminTable, TiketAdminItem } from '@/modules/tiket/components/TiketAdminTable';

export interface InventarisTabsProps {
  barangList: BarangItem[];
  stokLogList: StokLogItem[];
  tiketList: TiketAdminItem[];
}

export function InventarisTabs({
  barangList,
  stokLogList,
  tiketList,
}: InventarisTabsProps) {
  const pendingTicketsCount = React.useMemo(() => {
    return tiketList.filter((t) => t.status === 'MENUNGGU').length;
  }, [tiketList]);

  return (
    <Tabs defaultValue="katalog" className="space-y-6">
      <TabsList className="bg-neutral-tint/70 p-1 border border-border h-11">
        <TabsTrigger value="katalog" className="gap-2 px-4 py-2 text-xs font-semibold">
          <Package className="h-4 w-4" />
          Katalog Barang ({barangList.length})
        </TabsTrigger>
        <TabsTrigger value="tiket" className="gap-2 px-4 py-2 text-xs font-semibold">
          <Ticket className="h-4 w-4" />
          Tiket Layanan ({tiketList.length})
          {pendingTicketsCount > 0 && (
            <span className="ml-1 rounded-full bg-warning px-1.5 py-0.2 text-2xs font-bold text-white leading-none">
              {pendingTicketsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="riwayat" className="gap-2 px-4 py-2 text-xs font-semibold">
          <History className="h-4 w-4" />
          Riwayat Mutasi Stok
        </TabsTrigger>
      </TabsList>

      <TabsContent value="katalog" className="m-0 focus-visible:outline-none">
        <BarangTable data={barangList} />
      </TabsContent>

      <TabsContent value="tiket" className="m-0 focus-visible:outline-none">
        <TiketAdminTable data={tiketList} />
      </TabsContent>

      <TabsContent value="riwayat" className="m-0 focus-visible:outline-none">
        <StokLogTable data={stokLogList} />
      </TabsContent>
    </Tabs>
  );
}

