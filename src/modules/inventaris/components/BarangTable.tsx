'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Edit, ArrowUpDown, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarangFormDialog, BarangFormData } from './BarangFormDialog';
import { AdjustStokDialog, AdjustStokTarget } from './AdjustStokDialog';
import { deleteOrArchiveBarangAction } from '../actions';

export interface BarangItem {
  id: string;
  nama: string;
  kodeBarang: string;
  kategori: 'ATK' | 'ASET';
  stok: number;
  limitStok: number;
  satuan: string | null;
  deskripsi: string | null;
  fotoUrl: string | null;
  diarsipkanPada: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarangTableProps {
  data: BarangItem[];
}

export function BarangTable({ data }: BarangTableProps) {
  const [search, setSearch] = React.useState('');
  const [kategoriFilter, setKategoriFilter] = React.useState('ALL');
  const [stokFilter, setStokFilter] = React.useState('ALL');

  // Dialog states
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<BarangFormData | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [adjustTarget, setAdjustTarget] = React.useState<AdjustStokTarget | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);

  // Confirm delete / archive
  const [deleteTarget, setDeleteTarget] = React.useState<BarangItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        item.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));

      const matchKategori =
        kategoriFilter === 'ALL' || item.kategori === kategoriFilter;

      const matchStok =
        stokFilter === 'ALL' ||
        (stokFilter === 'HABIS' && item.stok === 0) ||
        (stokFilter === 'TERSEDIA' && item.stok > 0);

      return matchSearch && matchKategori && matchStok;
    });
  }, [data, search, kategoriFilter, stokFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteOrArchiveBarangAction(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus/mengarsipkan barang.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<BarangItem>[] = [
    {
      accessorKey: 'nama',
      header: 'Nama & Kode Barang',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">{row.original.nama}</div>
          <div className="text-xs font-mono text-text-secondary mt-0.5">
            {row.original.kodeBarang}
          </div>
          {row.original.deskripsi && (
            <div className="text-xs text-text-secondary/80 mt-1 line-clamp-1">
              {row.original.deskripsi}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            row.original.kategori === 'ATK'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-text-primary'
          }`}
        >
          {row.original.kategori}
        </span>
      ),
    },
    {
      accessorKey: 'stok',
      header: 'Stok Fisik',
      cell: ({ row }) => {
        const stok = row.original.stok;
        const limitStok = row.original.limitStok ?? 5;
        const satuan = row.original.satuan || 'Pcs';
        const isOutOfStock = stok === 0;
        const isLowStock = !isOutOfStock && stok <= limitStok;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm font-semibold ${
                isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : 'text-text-primary'
              }`}
            >
              {stok}
            </span>
            <span className="text-xs text-text-secondary">{satuan}</span>
            <span className="text-[11px] text-text-secondary">/ Min {limitStok}</span>
            {isOutOfStock && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-error-tint text-error">
                Habis
              </span>
            )}
            {isLowStock && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-warning-tint text-warning">
                Menipis
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu Aksi">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setAdjustTarget({
                      id: item.id,
                      nama: item.nama,
                      kodeBarang: item.kodeBarang,
                      stok: item.stok,
                      satuan: item.satuan,
                    });
                    setIsAdjustOpen(true);
                  }}
                >
                  <ArrowUpDown className="mr-2 h-4 w-4 text-primary" />
                  <span>Penyesuaian Stok</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setEditItem({
                      id: item.id,
                      nama: item.nama,
                      kodeBarang: item.kodeBarang,
                      kategori: item.kategori,
                      stok: item.stok,
                      satuan: item.satuan,
                      deskripsi: item.deskripsi,
                    });
                    setIsEditOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 text-text-secondary" />
                  <span>Ubah Data</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-error focus:text-error"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Hapus / Arsipkan</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                placeholder="Cari nama, kode, atau spesifikasi..."
                value={search}
                onChange={setSearch}
              />
            }
            filterSlot={
              <>
                <FilterSelect
                  value={kategoriFilter}
                  onChange={setKategoriFilter}
                  placeholder="Kategori Barang"
                  allOptionLabel="Semua Kategori"
                  options={[
                    { label: 'ATK (Habis Pakai)', value: 'ATK' },
                    { label: 'ASET (Inventaris)', value: 'ASET' },
                  ]}
                />
                <FilterSelect
                  value={stokFilter}
                  onChange={setStokFilter}
                  placeholder="Status Stok"
                  allOptionLabel="Semua Status Stok"
                  options={[
                    { label: 'Stok Tersedia', value: 'TERSEDIA' },
                    { label: 'Stok Habis (0)', value: 'HABIS' },
                  ]}
                />
              </>
            }
            actionsSlot={
              <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Tambah Barang</span>
              </Button>
            }
          />
        }
        columns={columns}
        data={filteredData}
        emptyTitle="Tidak Ada Barang"
        emptyDescription="Belum ada inventaris barang yang sesuai dengan filter pencarian."
      />

      <BarangFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
      />

      <BarangFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialData={editItem}
      />

      <AdjustStokDialog
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        target={adjustTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus atau Arsipkan Barang?"
        description={`Barang "${deleteTarget?.nama}" akan dihapus permanen jika belum ada riwayat transaksi/tiket, atau diarsipkan otomatis jika memiliki riwayat.`}
        confirmLabel="Proses Hapus/Arsip"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

