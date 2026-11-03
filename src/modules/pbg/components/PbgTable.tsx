'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  CheckCircle2,
  Undo2,
  Trash2,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/dates';
import { PbgFormDialog, PbgFormData } from './PbgFormDialog';
import {
  markPbgLunasAction,
  unmarkPbgLunasAction,
  deletePbgAction,
  getPbgFullContactAction,
} from '../actions';

export interface PbgItem {
  id: string;
  pemohon: string;
  noWa: string; // Sudah tersamar dari server (masking)
  noSkrd: string;
  lokasi: string;
  nominal: string;
  jatuhTempo: string; // YYYY-MM-DD
  status: 'BELUM_BAYAR' | 'LUNAS';
  dibayarPada: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PbgTableProps {
  data: PbgItem[];
}

function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function isPbgDueSoon(jatuhTempoStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = jatuhTempoStr.split('-').map(Number);
  if (parts.length !== 3) return false;
  const due = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 3;
}

export function PbgTable({ data }: PbgTableProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Dialog & Action States
  const [editItem, setEditItem] = React.useState<PbgFormData | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = React.useState(false);

  const [lunasTarget, setLunasTarget] = React.useState<PbgItem | null>(null);
  const [isSubmittingLunas, setIsSubmittingLunas] = React.useState(false);

  const [unmarkTarget, setUnmarkTarget] = React.useState<PbgItem | null>(null);
  const [isSubmittingUnmark, setIsSubmittingUnmark] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<PbgItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = React.useState(false);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.pemohon.toLowerCase().includes(search.toLowerCase()) ||
        item.noSkrd.toLowerCase().includes(search.toLowerCase()) ||
        item.lokasi.toLowerCase().includes(search.toLowerCase()) ||
        item.noWa.includes(search);

      let matchStatus = true;
      if (statusFilter === 'BELUM_BAYAR') {
        matchStatus = item.status === 'BELUM_BAYAR';
      } else if (statusFilter === 'LUNAS') {
        matchStatus = item.status === 'LUNAS';
      } else if (statusFilter === 'JATUH_TEMPO_3_HARI') {
        matchStatus = item.status === 'BELUM_BAYAR' && isPbgDueSoon(item.jatuhTempo);
      }

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const handleOpenEdit = async (item: PbgItem) => {
    setIsLoadingEdit(true);
    try {
      // Ambil nomor WA penuh yang tidak tersensor via Server Action khusus admin
      const full = await getPbgFullContactAction(item.id);
      setEditItem(full);
      setIsEditOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat rincian kontak tagihan.');
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleMarkLunasConfirm = async () => {
    if (!lunasTarget) return;
    setIsSubmittingLunas(true);
    try {
      const res = await markPbgLunasAction(lunasTarget.id);
      toast.success(res.message);
      setLunasTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menandai lunas tagihan.');
    } finally {
      setIsSubmittingLunas(false);
    }
  };

  const handleUnmarkLunasConfirm = async () => {
    if (!unmarkTarget) return;
    setIsSubmittingUnmark(true);
    try {
      const res = await unmarkPbgLunasAction(unmarkTarget.id);
      toast.success(res.message);
      setUnmarkTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membatalkan status lunas.');
    } finally {
      setIsSubmittingUnmark(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmittingDelete(true);
    try {
      const res = await deletePbgAction(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tagihan PBG.');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const columns: ColumnDef<PbgItem>[] = [
    {
      accessorKey: 'noSkrd',
      header: 'No. SKRD & Waktu',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-semibold text-text-primary">
            {row.original.noSkrd}
          </span>
          <div className="text-xs text-text-secondary mt-0.5">
            Dibuat {formatDate(row.original.createdAt)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pemohon',
      header: 'Pemohon & Kontak',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-text-primary">{row.original.pemohon}</div>
          <div className="text-xs font-mono text-text-secondary mt-0.5">
            WA: {row.original.noWa}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'lokasi',
      header: 'Lokasi Bangunan',
      cell: ({ row }) => (
        <p className="text-xs text-text-primary max-w-[220px] line-clamp-2" title={row.original.lokasi}>
          {row.original.lokasi}
        </p>
      ),
    },
    {
      accessorKey: 'nominal',
      header: 'Ketetapan Retribusi',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-text-primary">
          {formatRupiah(row.original.nominal)}
        </span>
      ),
    },
    {
      accessorKey: 'jatuhTempo',
      header: 'Jatuh Tempo',
      cell: ({ row }) => {
        const item = row.original;
        const dueSoon = item.status === 'BELUM_BAYAR' && isPbgDueSoon(item.jatuhTempo);

        return (
          <div className="space-y-1">
            <div className="text-xs font-medium text-text-primary">
              {formatDate(item.jatuhTempo)}
            </div>
            {dueSoon && (
              <StatusBadge status="PENDING" label="Jatuh Tempo ≤ 3 Hari" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status Pembayaran',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <StatusBadge status={item.status} />
            {item.status === 'LUNAS' && item.dibayarPada && (
              <div className="text-2xs text-text-secondary mt-1 font-mono">
                Lunas: {formatDate(item.dibayarPada)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8" disabled={isLoadingEdit}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Buka menu aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {item.status === 'BELUM_BAYAR' ? (
                <DropdownMenuItem
                  onClick={() => setLunasTarget(item)}
                  className="text-success focus:text-success"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tandai LUNAS
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setUnmarkTarget(item)}>
                  <Undo2 className="h-4 w-4 mr-2 text-warning" />
                  Batalkan Pelunasan
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                <Receipt className="h-4 w-4 mr-2 text-primary" />
                Ubah Data Tagihan
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setDeleteTarget(item)}
                className="text-error focus:text-error"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Tagihan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <DataTable
          toolbarSlot={
            <DataTableToolbar
              searchSlot={
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari pemohon, SKRD, lokasi..."
                />
              }
              filterSlot={
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allOptionLabel="Semua Status"
                  options={[
                    { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
                    { value: 'LUNAS', label: 'Lunas' },
                    { value: 'JATUH_TEMPO_3_HARI', label: 'Jatuh Tempo ≤ 3 Hari' },
                  ]}
                  className="w-[200px]"
                />
              }
            />
          }
          columns={columns}
          data={filteredData}
          emptyTitle="Belum ada data tagihan PBG"
          emptyDescription="Belum ada ketetapan retribusi PBG yang tercatat pada sistem."
        />
      </div>

      {/* Dialog Edit PBG */}
      <PbgFormDialog
        initialData={editItem}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Confirm Dialog Mark Lunas */}
      <ConfirmDialog
        open={!!lunasTarget}
        onOpenChange={(open) => !open && setLunasTarget(null)}
        title="Tandai Retribusi Lunas"
        description={`Konfirmasi penerimaan pembayaran retribusi PBG untuk SKRD ${lunasTarget?.noSkrd} sebesar ${
          lunasTarget ? formatRupiah(lunasTarget.nominal) : ''
        }?`}
        confirmLabel="Konfirmasi Lunas"
        onConfirm={handleMarkLunasConfirm}
        isLoading={isSubmittingLunas}
      />

      {/* Confirm Dialog Unmark Lunas */}
      <ConfirmDialog
        open={!!unmarkTarget}
        onOpenChange={(open) => !open && setUnmarkTarget(null)}
        title="Batalkan Status Pelunasan"
        description={`Apakah Anda yakin ingin membatalkan status lunas untuk SKRD ${unmarkTarget?.noSkrd} dan mengembalikannya ke BELUM BAYAR?`}
        confirmLabel="Batalkan Lunas"
        variant="destructive"
        onConfirm={handleUnmarkLunasConfirm}
        isLoading={isSubmittingUnmark}
      />

      {/* Confirm Dialog Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Ketetapan PBG"
        description={`Apakah Anda yakin ingin menghapus data tagihan SKRD ${deleteTarget?.noSkrd} atas nama ${deleteTarget?.pemohon}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Tagihan"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmittingDelete}
      />
    </>
  );
}
