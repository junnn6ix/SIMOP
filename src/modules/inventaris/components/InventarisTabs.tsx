'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const currentTab = tabParam === 'tiket' || tabParam === 'riwayat' ? tabParam : 'katalog';

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const pendingTicketsCount = React.useMemo(() => {
    return tiketList.filter((t) => t.status === 'MENUNGGU').length;
  }, [tiketList]);

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6 min-w-0 w-full">
      <div className="w-full min-w-0 overflow-x-auto pb-1 scrollbar-none">
        <TabsList className="bg-neutral-tint/70 p-1 border border-border h-11 inline-flex w-auto min-w-full sm:min-w-0 justify-start">
          <TabsTrigger value="katalog" className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0">
            <Package className="h-4 w-4 shrink-0" />
            <span>Katalog Barang ({barangList.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tiket" className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0">
            <Ticket className="h-4 w-4 shrink-0" />
            <span>Tiket Layanan ({tiketList.length})</span>
            {pendingTicketsCount > 0 && (
              <span className="ml-1 rounded-full bg-warning-tint text-warning-dark border border-warning/30 px-1.5 py-0.2 text-2xs font-bold leading-none">
                {pendingTicketsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0">
            <History className="h-4 w-4 shrink-0" />
            <span>Riwayat Mutasi Stok</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="katalog" className="m-0 min-w-0 w-full max-w-full overflow-hidden focus-visible:outline-none">
        <BarangTable data={barangList} />
      </TabsContent>

      <TabsContent value="tiket" className="m-0 min-w-0 w-full max-w-full overflow-hidden focus-visible:outline-none">
        <TiketAdminTable data={tiketList} />
      </TabsContent>

      <TabsContent value="riwayat" className="m-0 min-w-0 w-full max-w-full overflow-hidden focus-visible:outline-none">
        <StokLogTable data={stokLogList} />
      </TabsContent>
    </Tabs>
  );
}

