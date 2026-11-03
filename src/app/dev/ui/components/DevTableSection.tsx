'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Section } from '@/components/layout/Section';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { RowActions } from '@/components/shared/RowActions';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TabsNav } from '@/components/shared/TabsNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DummyBarang {
  id: string;
  nama: string;
  kategori: 'ATK' | 'ASET';
  stok: number;
  limitStok: number;
  status: 'AMAN' | 'MENIPIS';
}

const dummyData: DummyBarang[] = [
  { id: '1', nama: 'Kertas HVS A4 80gr Sinar Dunia', kategori: 'ATK', stok: 24, limitStok: 5, status: 'AMAN' },
  { id: '2', nama: 'Tinta Printer Epson L3110 Black', kategori: 'ATK', stok: 2, limitStok: 5, status: 'MENIPIS' },
  { id: '3', nama: 'PC All-in-One Loket Pelayanan 1', kategori: 'ASET', stok: 1, limitStok: 1, status: 'AMAN' },
  { id: '4', nama: 'Meja Kerja Staff Kayu Jati', kategori: 'ASET', stok: 4, limitStok: 2, status: 'AMAN' },
  { id: '5', nama: 'Stapler Besar HD-50 Max', kategori: 'ATK', stok: 1, limitStok: 3, status: 'MENIPIS' },
];

export function DevTableSection() {
  const [data, setData] = React.useState(dummyData);
  const [search, setSearch] = React.useState('');
  const [filterKategori, setFilterKategori] = React.useState('ALL');
  const [showLoading, setShowLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (showEmpty) return [];
    return data.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'ALL' || item.kategori === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori, showEmpty]);

  const columns: ColumnDef<DummyBarang>[] = [
    {
      accessorKey: 'nama',
      header: 'Nama Barang',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-text-primary">{row.original.nama}</p>
          <p className="text-xs text-text-secondary font-mono">ID: BRG-00{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      cell: ({ row }) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-tag bg-muted text-text-secondary font-medium">
          {row.original.kategori}
        </span>
      ),
    },
    {
      accessorKey: 'stok',
      header: 'Stok Tersedia',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{row.original.stok}</span>
          <span className="text-xs text-text-secondary">/ Min {row.original.limitStok}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Kondisi Stok',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status === 'AMAN' ? 'SELESAI' : 'MENUNGGU'}
          label={row.original.status === 'AMAN' ? 'Stok Cukup' : 'Stok Menipis'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: 'Ubah Data', onClick: () => toast.info(`Ubah data ${row.original.nama}`) },
            { label: 'Penyesuaian Stok', onClick: () => toast.info(`Penyesuaian stok ${row.original.nama}`) },
            {
              label: 'Arsipkan Barang',
              destructive: true,
              separatorBefore: true,
              onClick: () => setData((prev) => prev.filter((b) => b.id !== row.original.id)),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Section
      title="5. Tabel Data (DataTable TanStack)"
      description="Sorting, filtering, pagination, loading skeleton, empty state, dan opsi tampil sebagai kartu mobile."
    >
      <div className="space-y-4">
        <TabsNav
          tabs={[
            { id: 'semua', label: 'Semua Barang', count: dummyData.length },
            { id: 'atk', label: 'Alat Tulis Kantor (ATK)', count: 3 },
            { id: 'aset', label: 'Aset & Inventaris', count: 2 },
          ]}
          defaultTab="semua"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowLoading(!showLoading)}
          >
            {showLoading ? 'Matikan Loading' : 'Simulasi Loading'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowEmpty(!showEmpty)}
          >
            {showEmpty ? 'Tampilkan Data' : 'Simulasi Empty State'}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={showLoading}
          emptyTitle="Data Barang Tidak Ditemukan"
          emptyDescription="Tidak ada data barang yang sesuai dengan kata kunci pencarian Anda."
          toolbarSlot={
            <DataTableToolbar
              searchSlot={
                <SearchInput
                  placeholder="Cari nama barang..."
                  value={search}
                  onChange={setSearch}
                />
              }
              filterSlot={
                <FilterSelect
                  value={filterKategori}
                  onChange={setFilterKategori}
                  options={[
                    { label: 'ATK', value: 'ATK' },
                    { label: 'Aset', value: 'ASET' },
                  ]}
                  placeholder="Pilih Kategori"
                />
              }
              actionsSlot={
                <Button size="sm" variant="primary">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Barang</span>
                </Button>
              }
            />
          }
        />
      </div>
    </Section>
  );
}
