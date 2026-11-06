'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/dates';
import type { NotifikasiLogItem } from '../queries';

export interface NotifikasiLogTableProps {
  data: NotifikasiLogItem[];
}

function formatJenisNotifikasi(jenis: string): string {
  switch (jenis) {
    case 'PBG_JATUH_TEMPO_H_MIN_3':
      return 'Otomatis H-3';
    case 'PBG_JATUH_TEMPO_HARI_H':
      return 'Otomatis Hari-H';
    case 'MANUAL':
      return 'Pemicu Manual';
    default:
      return jenis.replace(/_/g, ' ');
  }
}

export function NotifikasiLogTable({ data }: NotifikasiLogTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.pemohon.toLowerCase().includes(q) ||
        item.noSkrd.toLowerCase().includes(q) ||
        item.waTujuan.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [data, searchTerm, statusFilter]);

  const columns: ColumnDef<NotifikasiLogItem>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Waktu Pengiriman',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-text-primary">
            {formatDate(row.original.createdAt)}
          </div>
          <div className="text-2xs text-text-secondary font-mono mt-0.5">
            {new Date(row.original.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
            })}{' '}
            WIB
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pemohon',
      header: 'Pemohon & SKRD',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">
            {row.original.pemohon}
          </div>
          <div className="text-2xs font-mono text-text-secondary mt-0.5">
            {row.original.noSkrd}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'waTujuan',
      header: 'No. WhatsApp',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-secondary">
          {row.original.waTujuan}
        </span>
      ),
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis Pengingat',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-2 text-text-secondary border border-border">
          {formatJenisNotifikasi(row.original.jenis)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'respons',
      header: 'Respon Gateway',
      cell: ({ row }) => {
        const resp = row.original.respons || '-';
        return (
          <div
            className="text-2xs font-mono text-text-secondary max-w-[220px] truncate"
            title={resp}
          >
            {resp}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      <DataTable
        toolbarSlot={
          <DataTableToolbar
            searchSlot={
              <SearchInput
                placeholder="Cari pemohon, SKRD, atau kontak..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            }
            filterSlot={
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                allOptionLabel="Semua Status"
                options={[
                  { label: 'Terkirim', value: 'TERKIRIM' },
                  { label: 'Dry Run', value: 'DRY_RUN' },
                  { label: 'Gagal', value: 'GAGAL' },
                  { label: 'Memproses', value: 'PENDING' },
                ]}
                className="w-full sm:w-[180px]"
              />
            }
          />
        }
        columns={columns}
        data={filteredData}
        emptyTitle="Belum ada riwayat notifikasi"
        emptyDescription="Belum ada riwayat notifikasi pengingat retribusi yang tercatat pada sistem."
      />
    </div>
  );
}

