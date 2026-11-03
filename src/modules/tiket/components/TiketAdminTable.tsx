'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2,
  XCircle,
  Wrench,
  Check,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/dates';
import { accTiketAction, updateTiketStatusAction } from '../actions';

export interface TiketAdminItem {
  id: string;
  nomorTiket: string;
  pemohonId: string;
  pemohonName: string;
  pemohonUsername: string | null;
  pemohonBidang: 'SEKRETARIAT' | 'PTSP' | 'PM' | 'PENGAWASAN' | null;
  barangId: string;
  barangNama: string;
  barangKode: string;
  barangKategori: 'ATK' | 'ASET';
  barangSatuan: string | null;
  barangStok: number;
  jenis: 'PERMINTAAN_BARANG' | 'LAPOR_KERUSAKAN';
  jumlah: number;
  keperluan: string;
  status: 'MENUNGGU' | 'ACC' | 'MAINTENANCE' | 'DITOLAK' | 'SELESAI';
  catatanAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TiketAdminTableProps {
  data: TiketAdminItem[];
}

export function TiketAdminTable({ data }: TiketAdminTableProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [jenisFilter, setJenisFilter] = React.useState('ALL');

  // Acc Dialog State
  const [accTarget, setAccTarget] = React.useState<TiketAdminItem | null>(null);
  const [accCatatan, setAccCatatan] = React.useState('');
  const [isSubmittingAcc, setIsSubmittingAcc] = React.useState(false);

  // Reject Dialog State
  const [rejectTarget, setRejectTarget] = React.useState<TiketAdminItem | null>(null);
  const [rejectAlasan, setRejectAlasan] = React.useState('');
  const [isSubmittingReject, setIsSubmittingReject] = React.useState(false);

  // Status Change Dialog State (Maintenance / Selesai)
  const [statusTarget, setStatusTarget] = React.useState<{
    tiket: TiketAdminItem;
    newStatus: 'MAINTENANCE' | 'SELESAI';
  } | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = React.useState(false);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.nomorTiket.toLowerCase().includes(search.toLowerCase()) ||
        item.pemohonName.toLowerCase().includes(search.toLowerCase()) ||
        item.barangNama.toLowerCase().includes(search.toLowerCase()) ||
        item.keperluan.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchJenis = jenisFilter === 'ALL' || item.jenis === jenisFilter;

      return matchSearch && matchStatus && matchJenis;
    });
  }, [data, search, statusFilter, jenisFilter]);

  const handleAccConfirm = async () => {
    if (!accTarget) return;
    setIsSubmittingAcc(true);
    try {
      const res = await accTiketAction({
        tiketId: accTarget.id,
        catatanAdmin: accCatatan.trim() || null,
      });
      toast.success(res.message);
      setAccTarget(null);
      setAccCatatan('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui tiket.');
    } finally {
      setIsSubmittingAcc(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setIsSubmittingReject(true);
    try {
      const res = await updateTiketStatusAction({
        tiketId: rejectTarget.id,
        status: 'DITOLAK',
        catatanAdmin: rejectAlasan.trim() || 'Tiket ditolak oleh Admin.',
      });
      toast.success(res.message);
      setRejectTarget(null);
      setRejectAlasan('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menolak tiket.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusTarget) return;
    setIsSubmittingStatus(true);
    try {
      const res = await updateTiketStatusAction({
        tiketId: statusTarget.tiket.id,
        status: statusTarget.newStatus,
      });
      toast.success(res.message);
      setStatusTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status tiket.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const columns: ColumnDef<TiketAdminItem>[] = [
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
      accessorKey: 'pemohonName',
      header: 'Pemohon',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-text-primary">{row.original.pemohonName}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center rounded-md bg-neutral-tint px-2 py-0.5 text-2xs font-semibold text-text-secondary border border-border">
              {row.original.pemohonBidang || 'SEKRETARIAT'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'barangNama',
      header: 'Barang Terkait',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">{row.original.barangNama}</div>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
            <span className="font-mono">{row.original.barangKode}</span>
            <span>•</span>
            <span
              className={
                row.original.barangStok < row.original.jumlah &&
                  row.original.jenis === 'PERMINTAAN_BARANG' &&
                  row.original.status === 'MENUNGGU'
                  ? 'text-error font-semibold'
                  : 'text-text-secondary'
              }
            >
              Stok: {row.original.barangStok} {row.original.barangSatuan || 'Pcs'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis & Jumlah',
      cell: ({ row }) => {
        const isPermintaan = row.original.jenis === 'PERMINTAAN_BARANG';
        return (
          <div>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${isPermintaan
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
        <div className="max-w-[240px]">
          <p className="text-xs text-text-primary line-clamp-2" title={row.original.keperluan}>
            {row.original.keperluan}
          </p>
          {row.original.catatanAdmin && (
            <div className="mt-1.5 rounded-md bg-neutral-tint/70 p-1.5 text-2xs text-text-secondary border border-border/60">
              <span className="font-semibold text-text-primary">Admin: </span>
              {row.original.catatanAdmin}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Buka menu aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {item.status === 'MENUNGGU' && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setAccCatatan('');
                      setAccTarget(item);
                    }}
                    className="text-success focus:text-success"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Setujui (ACC)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRejectAlasan('');
                      setRejectTarget(item);
                    }}
                    className="text-error focus:text-error"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak Tiket
                  </DropdownMenuItem>
                </>
              )}

              {item.status === 'ACC' && (
                <>
                  {item.jenis === 'LAPOR_KERUSAKAN' && (
                    <DropdownMenuItem
                      onClick={() =>
                        setStatusTarget({ tiket: item, newStatus: 'MAINTENANCE' })
                      }
                    >
                      <Wrench className="h-4 w-4 mr-2 text-warning" />
                      Proses Maintenance
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      setStatusTarget({ tiket: item, newStatus: 'SELESAI' })
                    }
                  >
                    <Check className="h-4 w-4 mr-2 text-success" />
                    Tandai Selesai
                  </DropdownMenuItem>
                </>
              )}

              {item.status === 'MAINTENANCE' && (
                <DropdownMenuItem
                  onClick={() =>
                    setStatusTarget({ tiket: item, newStatus: 'SELESAI' })
                  }
                >
                  <Check className="h-4 w-4 mr-2 text-success" />
                  Selesai Perbaikan
                </DropdownMenuItem>
              )}

              {item.status !== 'MENUNGGU' &&
                item.status !== 'ACC' &&
                item.status !== 'MAINTENANCE' && (
                  <div className="px-2 py-1.5 text-xs text-text-secondary italic">
                    Tiket telah final ({item.status})
                  </div>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-4 min-w-0 w-full max-w-full">
        <DataTable
          toolbarSlot={
            <DataTableToolbar
              searchSlot={
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari nomor tiket, pemohon, barang..."
                />
              }
              filterSlot={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                    className="w-full sm:w-[160px]"
                  />
                  <FilterSelect
                    value={jenisFilter}
                    onChange={setJenisFilter}
                    allOptionLabel="Semua Layanan"
                    options={[
                      { value: 'PERMINTAAN_BARANG', label: 'Permintaan Barang' },
                      { value: 'LAPOR_KERUSAKAN', label: 'Lapor Kerusakan' },
                    ]}
                    className="w-full sm:w-[180px]"
                  />
                </div>
              }
            />
          }
          columns={columns}
          data={filteredData}
          emptyTitle="Belum ada tiket layanan"
          emptyDescription="Belum ada tiket layanan yang terdaftar saat ini."
        />
      </div>

      {/* Dialog ACC Tiket */}
      <Dialog open={!!accTarget} onOpenChange={(open) => !open && setAccTarget(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Setujui (ACC) Tiket Layanan</DialogTitle>
            <DialogDescription>
              Pastikan rincian permintaan sesuai sebelum menyetujui tiket ini.
            </DialogDescription>
          </DialogHeader>

          {accTarget && (
            <DialogBody className="space-y-4">
              <div className="rounded-lg border border-border bg-neutral-tint/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Nomor Tiket:</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {accTarget.nomorTiket}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Pemohon:</span>
                  <span className="font-medium text-text-primary">
                    {accTarget.pemohonName} ({accTarget.pemohonBidang || 'SEKRETARIAT'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Barang:</span>
                  <span className="font-medium text-text-primary">
                    {accTarget.barangNama}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Jumlah Diajukan:</span>
                  <span className="font-bold text-text-primary">
                    {accTarget.jumlah} {accTarget.barangSatuan || 'Pcs'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Stok Tersedia:</span>
                  <span
                    className={`font-bold ${accTarget.barangStok >= accTarget.jumlah
                        ? 'text-success'
                        : 'text-error'
                      }`}
                  >
                    {accTarget.barangStok} {accTarget.barangSatuan || 'Pcs'}
                  </span>
                </div>
              </div>

              {accTarget.jenis === 'PERMINTAAN_BARANG' && (
                <div className="flex items-start gap-2 rounded-lg bg-warning-tint/50 border border-warning/30 p-3 text-xs text-warning-dark">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                  <span>
                    Menyetujui permintaan barang akan secara <strong>otomatis memotong stok</strong> sebanyak{' '}
                    <strong>{accTarget.jumlah} {accTarget.barangSatuan || 'Pcs'}</strong> dalam satu transaksi basis data.
                  </span>
                </div>
              )}

              <FormField
                label="Catatan untuk Pemohon"
                description="Contoh: Barang dapat diambil di bagian umum (opsional)"
              >
                <Textarea
                  placeholder="Catatan persetujuan admin..."
                  value={accCatatan}
                  onChange={(e) => setAccCatatan(e.target.value)}
                  className="resize-none h-20 text-xs"
                />
              </FormField>
            </DialogBody>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAccTarget(null)}
              disabled={isSubmittingAcc}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAccConfirm}
              disabled={
                isSubmittingAcc ||
                (accTarget?.jenis === 'PERMINTAAN_BARANG' &&
                  accTarget.barangStok < accTarget.jumlah)
              }
              className="bg-success text-surface hover:bg-success-dark"
            >
              {isSubmittingAcc ? 'Memproses...' : 'Setujui (ACC)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tolak Tiket */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Tolak Tiket Layanan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan agar pemohon mengetahui penyebabnya.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <FormField label="Alasan Penolakan" required>
              <Textarea
                placeholder="Masukkan alasan penolakan tiket ini..."
                value={rejectAlasan}
                onChange={(e) => setRejectAlasan(e.target.value)}
                className="resize-none h-24 text-xs"
              />
            </FormField>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectTarget(null)}
              disabled={isSubmittingReject}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isSubmittingReject}
            >
              {isSubmittingReject ? 'Menolak...' : 'Tolak Tiket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Status Change */}
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.newStatus === 'MAINTENANCE'
            ? 'Proses Maintenance Aset'
            : 'Tandai Tiket Selesai'
        }
        description={
          statusTarget?.newStatus === 'MAINTENANCE'
            ? `Apakah aset "${statusTarget?.tiket.barangNama}" akan dialihkan ke status perbaikan (maintenance)?`
            : `Tandai tiket #${statusTarget?.tiket.nomorTiket} sebagai telah selesai ditangani?`
        }
        confirmLabel={
          statusTarget?.newStatus === 'MAINTENANCE'
            ? 'Mulai Maintenance'
            : 'Selesaikan'
        }
        onConfirm={handleStatusChangeConfirm}
        isLoading={isSubmittingStatus}
      />
    </>
  );
}
