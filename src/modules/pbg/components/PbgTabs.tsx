'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Receipt, Bot, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PbgTable, PbgItem } from './PbgTable';
import { WaBotSettingsPanel } from './WaBotSettingsPanel';
import { NotifikasiLogTable } from './NotifikasiLogTable';
import type { NotifikasiLogItem } from '../queries';

export interface PbgTabsProps {
  pbgList: PbgItem[];
  botAktif: boolean;
  template: string;
  hasFonnteToken: boolean;
  pendingReminderCount: number;
  notifikasiLogs: NotifikasiLogItem[];
}

export function PbgTabs({
  pbgList,
  botAktif,
  template,
  hasFonnteToken,
  pendingReminderCount,
  notifikasiLogs,
}: PbgTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const currentTab =
    tabParam === 'pengaturan' || tabParam === 'riwayat' ? tabParam : 'tagihan';

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="space-y-6 min-w-0 w-full"
    >
      <div className="w-full min-w-0 overflow-x-auto pb-1 scrollbar-none">
        <TabsList className="bg-neutral-tint/70 p-1 border border-border h-11 inline-flex w-auto min-w-full sm:min-w-0 justify-start">
          <TabsTrigger
            value="tagihan"
            className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0"
          >
            <Receipt className="h-4 w-4 shrink-0" />
            <span>Daftar Tagihan PBG ({pbgList.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="pengaturan"
            className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0"
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span>Pengaturan Bot WA</span>
            {pendingReminderCount > 0 && (
              <span className="ml-1 rounded-full bg-warning-tint text-warning-dark border border-warning/30 px-1.5 py-0.2 text-2xs font-bold leading-none">
                {pendingReminderCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="riwayat"
            className="gap-2 px-3 sm:px-4 py-2 text-xs font-semibold shrink-0"
          >
            <History className="h-4 w-4 shrink-0" />
            <span>Riwayat Pengiriman ({notifikasiLogs.length})</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tagihan" className="mt-0 focus-visible:outline-none overflow-hidden">
        <PbgTable data={pbgList} />
      </TabsContent>

      <TabsContent value="pengaturan" className="mt-0 focus-visible:outline-none">
        <WaBotSettingsPanel
          initialBotAktif={botAktif}
          initialTemplate={template}
          hasFonnteToken={hasFonnteToken}
          pendingReminderCount={pendingReminderCount}
        />
      </TabsContent>

      <TabsContent value="riwayat" className="mt-0 focus-visible:outline-none overflow-hidden">
        <NotifikasiLogTable data={notifikasiLogs} />
      </TabsContent>
    </Tabs>
  );
}

