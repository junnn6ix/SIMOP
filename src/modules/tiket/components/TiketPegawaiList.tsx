'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/dates';

export interface TiketPegawaiItem {
  id: string;
  nomorTiket: string;
  barangId: string;
  barangNama: string;
  barangKode: string;
  barangKategori: 'ATK' | 'ASET';
  barangSatuan: string | null;
  jenis: 'PERMINTAAN_BARANG' | 'LAPOR_KERUSAKAN';
  jumlah: number;
  keperluan: string;
  status: 'MENUNGGU' | 'ACC' | 'MAINTENANCE' | 'DITOLAK' | 'SELESAI';
  catatanAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TiketPegawaiListProps {
  data: TiketPegawaiItem[];
}

export function TiketPegawaiList({ data }: TiketPegawaiListProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [jenisFilter, setJenisFilter] = React.useState('ALL');

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.nomorTiket.toLowerCase().includes(search.toLowerCase()) ||
        item.barangNama.toLowerCase().includes(search.toLowerCase()) ||
        item.keperluan.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchJenis = jenisFilter === 'ALL' || item.jenis === jenisFilter;

      return matchSearch && matchStatus && matchJenis;
    });
  }, [data, search, statusFilter, jenisFilter]);

  const columns: ColumnDef<TiketPegawaiItem>[] = [
    {
      accessorKey: 'nomorTiket',
      header: 'Nomor Tiket & Waktu',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-semibold text-text-primary">
            {row.original.nomorTiket}
          </span>
          <div className="text-xs text-text-secondary mt-0.5">
            {formatDateTime(row.original.createdAt)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'barangNama',
      header: 'Barang / Aset',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">{row.original.barangNama}</div>
          <div className="text-xs font-mono text-text-secondary mt-0.5">
            {row.original.barangKode} ({row.original.barangKategori})
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis Layanan & Jumlah',
      cell: ({ row }) => {
        const isPermintaan = row.original.jenis === 'PERMINTAAN_BARANG';
        return (
          <div>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                isPermintaan
                  ? 'bg-brand/10 text-brand border-brand/20'
                  : 'bg-warning-tint text-warning-dark border-warning/30'
              }`}
            >
              {isPermintaan ? 'Permintaan Barang' : 'Lapor Kerusakan'}
            </span>
            <div className="text-xs font-medium text-text-secondary mt-1">
              Jumlah: <span className="font-semibold text-text-primary">{row.original.jumlah}</span>{' '}
              {row.original.barangSatuan || 'Pcs'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'keperluan',
      header: 'Keperluan / Keterangan',
      cell: ({ row }) => (
        <div className="max-w-[280px]">
          <p className="text-xs text-text-primary line-clamp-2" title={row.original.keperluan}>
            {row.original.keperluan}
          </p>
          {row.original.catatanAdmin && (
            <div className="mt-1.5 rounded-md bg-neutral-tint/70 p-1.5 text-2xs text-text-secondary border border-border/60">
              <span className="font-semibold text-text-primary">Catatan Admin: </span>
              {row.original.catatanAdmin}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status Pengajuan',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        toolbarSlot={
          <DataTableToolbar
            searchSlot={
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari nomor tiket, nama barang..."
              />
            }
            filterSlot={
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allOptionLabel="Semua Status"
                  options={[
                    { value: 'MENUNGGU', label: 'Menunggu' },
                    { value: 'ACC', label: 'Disetujui (ACC)' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                    { value: 'SELESAI', label: 'Selesai' },
                    { value: 'DITOLAK', label: 'Ditolak' },
                  ]}
                  className="w-[160px]"
                />
                <FilterSelect
                  value={jenisFilter}
                  onChange={setJenisFilter}
                  allOptionLabel="Semua Layanan"
                  options={[
                    { value: 'PERMINTAAN_BARANG', label: 'Permintaan Barang' },
                    { value: 'LAPOR_KERUSAKAN', label: 'Lapor Kerusakan' },
                  ]}
                  className="w-[180px]"
                />
              </div>
            }
          />
        }
        columns={columns}
        data={filteredData}
        emptyTitle="Belum ada tiket diajukan"
        emptyDescription="Anda belum pernah mengajukan permohonan barang atau laporan kerusakan."
      />
    </div>
  );
}
