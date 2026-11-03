'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowDownRight, ArrowUpRight, Search } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { formatDateTime } from '@/lib/dates';

export interface StokLogItem {
  id: string;
  barangId: string;
  barangNama: string;
  barangKode: string;
  barangSatuan: string | null;
  tipe: 'MASUK' | 'KELUAR' | 'PENYESUAIAN';
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  keterangan: string;
  tiketId: string | null;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface StokLogTableProps {
  data: StokLogItem[];
}

export function StokLogTable({ data }: StokLogTableProps) {
  const [search, setSearch] = React.useState('');
  const [tipeFilter, setTipeFilter] = React.useState('ALL');

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.barangNama.toLowerCase().includes(search.toLowerCase()) ||
        item.barangKode.toLowerCase().includes(search.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
        item.userName.toLowerCase().includes(search.toLowerCase());

      const matchTipe = tipeFilter === 'ALL' || item.tipe === tipeFilter;

      return matchSearch && matchTipe;
    });
  }, [data, search, tipeFilter]);

  const columns: ColumnDef<StokLogItem>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Waktu Mutasi',
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'barangNama',
      header: 'Barang Inventaris',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary text-sm">
            {row.original.barangNama}
          </div>
          <div className="text-xs font-mono text-text-secondary mt-0.5">
            {row.original.barangKode}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipe',
      header: 'Arah Mutasi',
      cell: ({ row }) => {
        const tipe = row.original.tipe;
        const isMasuk = tipe === 'MASUK';

        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
              isMasuk
                ? 'bg-success-tint text-success border border-success/30'
                : 'bg-error-tint text-error border border-error/30'
            }`}
          >
            {isMasuk ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            <span>{tipe}</span>
          </span>
        );
      },
    },
    {
      accessorKey: 'jumlah',
      header: 'Perubahan Stok',
      cell: ({ row }) => {
        const item = row.original;
        const satuan = item.barangSatuan || 'Pcs';
        const isMasuk = item.tipe === 'MASUK';

        return (
          <div className="text-xs">
            <span
              className={`font-mono font-bold ${
                isMasuk ? 'text-success' : 'text-error'
              }`}
            >
              {isMasuk ? `+${item.jumlah}` : `-${item.jumlah}`} {satuan}
            </span>
            <div className="text-text-secondary text-[11px] mt-0.5">
              {item.stokSebelum} ➔ {item.stokSesudah} {satuan}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'keterangan',
      header: 'Keterangan Mutasi & Petugas',
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="text-text-primary font-medium">{row.original.keterangan}</div>
          <div className="text-text-secondary text-[11px] mt-0.5">
            Oleh: {row.original.userName}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        toolbarSlot={
          <DataTableToolbar
            searchSlot={
              <SearchInput
                placeholder="Cari mutasi barang, keterangan, petugas..."
                value={search}
                onChange={setSearch}
              />
            }
            filterSlot={
              <FilterSelect
                value={tipeFilter}
                onChange={setTipeFilter}
                placeholder="Arah Mutasi"
                allOptionLabel="Semua Arah"
                options={[
                  { label: 'Penambahan (MASUK)', value: 'MASUK' },
                  { label: 'Pengurangan (KELUAR)', value: 'KELUAR' },
                ]}
              />
            }
          />
        }
        columns={columns}
        data={filteredData}
        emptyTitle="Tidak Ada Riwayat Stok"
        emptyDescription="Belum ada transaksi mutasi stok barang yang tercatat."
      />
    </div>
  );
}

