'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, FileSearch, MapPin, Building, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateShort } from '@/lib/dates';
import { deleteJadwalAction } from '../actions';

export interface JadwalAdminItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  pegawaiId: string;
  pegawaiName: string;
  pegawaiUsername: string | null;
  pegawaiBidang: string;
  lokasiTipe: 'DALAM_KANTOR' | 'LUAR_KANTOR';
  alamatLokasi: string | null;
  status: 'BELUM_DIKERJAKAN' | 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK';
  laporanTeks: string | null;
  catatanVerifikator: string | null;
  buktiKey: string | null;
  pdfKey: string | null;
  diverifikasiOlehId: string | null;
  diverifikasiPada: Date | null;
  createdAt: Date;
}

export interface JadwalAdminTableProps {
  data: JadwalAdminItem[];
}

export function JadwalAdminTable({ data }: JadwalAdminTableProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [lokasiFilter, setLokasiFilter] = React.useState('ALL');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<JadwalAdminItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Preview dialog
  const [previewItem, setPreviewItem] = React.useState<JadwalAdminItem | null>(null);
  const [previewFotoUrl, setPreviewFotoUrl] = React.useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = React.useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.judul.toLowerCase().includes(search.toLowerCase()) ||
        item.pegawaiName.toLowerCase().includes(search.toLowerCase()) ||
        (item.pegawaiUsername && item.pegawaiUsername.toLowerCase().includes(search.toLowerCase())) ||
        (item.alamatLokasi && item.alamatLokasi.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchLokasi = lokasiFilter === 'ALL' || item.lokasiTipe === lokasiFilter;

      return matchSearch && matchStatus && matchLokasi;
    });
  }, [data, search, statusFilter, lokasiFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteJadwalAction(deleteTarget.id);
      toast.success('Jadwal penugasan berhasil dihapus.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus jadwal penugasan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPreview = async (item: JadwalAdminItem) => {
    setPreviewItem(item);
    setPreviewFotoUrl(null);
    setPreviewPdfUrl(null);
    setIsLoadingPreview(true);

    try {
      if (item.buktiKey) {
        const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.buktiKey)}`);
        if (res.ok) {
          const json = await res.json();
          setPreviewFotoUrl(json.previewUrl);
        }
      }

      if (item.pdfKey) {
        const res = await fetch(`/api/uploads/preview?key=${encodeURIComponent(item.pdfKey)}`);
        if (res.ok) {
          const json = await res.json();
          setPreviewPdfUrl(json.previewUrl);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil URL pratinjau:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const columns: ColumnDef<JadwalAdminItem>[] = [
    {
      accessorKey: 'judul',
      header: 'Penugasan & Waktu',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">{row.original.judul}</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {formatDateShort(row.original.tanggalMulai)}
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
      accessorKey: 'pegawaiName',
      header: 'Pegawai Bertugas',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-text-primary text-sm">
            {row.original.pegawaiName}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-secondary">
              @{row.original.pegawaiUsername || '-'}
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-text-secondary">
              {row.original.pegawaiBidang}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'lokasiTipe',
      header: 'Lokasi Pelaksanaan',
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            {row.original.lokasiTipe === 'DALAM_KANTOR' ? (
              <>
                <Building className="h-3.5 w-3.5 text-text-secondary" />
                <span>Dalam Kantor</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Luar Kantor</span>
              </>
            )}
          </div>
          {row.original.alamatLokasi && (
            <div className="text-text-secondary mt-0.5 line-clamp-1">
              {row.original.alamatLokasi}
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
      header: '',
      cell: ({ row }) => {
        const item = row.original;
        const hasEvidence = Boolean(item.buktiKey || item.pdfKey);

        return (
          <div className="flex items-center justify-end gap-1">
            {hasEvidence && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenPreview(item)}
                aria-label="Lihat Bukti"
                title="Lihat Bukti Pelaksanaan"
              >
                <FileSearch className="h-4 w-4 text-primary" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-error hover:bg-error-tint"
              onClick={() => setDeleteTarget(item)}
              aria-label="Hapus Jadwal"
              title="Hapus Jadwal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchSlot={
          <SearchInput
            placeholder="Cari tugas, pegawai, lokasi..."
            value={search}
            onChange={setSearch}
          />
        }
        filterSlot={
          <>
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status Tugas"
              allOptionLabel="Semua Status"
              options={[
                { label: 'Belum Dikerjakan', value: 'BELUM_DIKERJAKAN' },
                { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI' },
                { label: 'Selesai Terverifikasi', value: 'SELESAI' },
              ]}
            />
            <FilterSelect
              value={lokasiFilter}
              onChange={setLokasiFilter}
              placeholder="Tipe Lokasi"
              allOptionLabel="Semua Lokasi"
              options={[
                { label: 'Dalam Kantor', value: 'DALAM_KANTOR' },
                { label: 'Luar Kantor', value: 'LUAR_KANTOR' },
              ]}
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={filteredData}
        emptyTitle="Tidak Ada Jadwal"
        emptyDescription="Belum ada data jadwal penugasan yang sesuai filter."
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Penugasan Jadwal?"
        description={`Penugasan "${deleteTarget?.judul}" untuk pegawai ${deleteTarget?.pegawaiName} akan dihapus secara permanen.`}
        confirmLabel="Hapus Jadwal"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Dialog Preview Bukti */}
      <Dialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti Pelaksanaan: {previewItem?.judul}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <div className="text-xs text-text-secondary">Pegawai Pelaksana</div>
              <div className="font-semibold text-text-primary">
                {previewItem?.pegawaiName} (@{previewItem?.pegawaiUsername})
              </div>
            </div>

            {previewItem?.laporanTeks && (
              <div className="p-3 rounded-panel bg-muted/50 border border-border">
                <div className="text-xs font-semibold text-text-primary mb-1">
                  Catatan / Ringkasan Pelaksanaan
                </div>
                <p className="text-xs text-text-secondary whitespace-pre-wrap">
                  {previewItem.laporanTeks}
                </p>
              </div>
            )}

            {isLoadingPreview ? (
              <div className="p-8 text-center text-sm text-text-secondary">
                Memuat berkas bukti...
              </div>
            ) : (
              <div className="space-y-3">
                {previewFotoUrl && (
                  <div>
                    <div className="text-xs font-semibold text-text-primary mb-1.5">
                      Foto Bukti Lapangan
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewFotoUrl}
                      alt="Foto Bukti Tugas"
                      className="w-full max-h-96 object-contain rounded-panel border border-border bg-black/5"
                    />
                  </div>
                )}

                {previewPdfUrl && (
                  <div className="pt-2">
                    <a
                      href={previewPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Dokumen PDF Pendukung</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
