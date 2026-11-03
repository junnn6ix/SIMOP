'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, KeyRound, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PegawaiFormDialog, PegawaiFormData } from './PegawaiFormDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { togglePegawaiStatusAction } from '../actions';

export interface PegawaiItem {
  id: string;
  name: string;
  username: string | null;
  role: 'ADMIN' | 'PEGAWAI';
  bidang: 'SEKRETARIAT' | 'PTSP' | 'PM' | 'PENGAWASAN';
  nip: string | null;
  aktif: boolean;
  banned: boolean;
  createdAt: Date;
}

export interface PegawaiTableProps {
  data: PegawaiItem[];
}

export function PegawaiTable({ data }: PegawaiTableProps) {
  const [search, setSearch] = React.useState('');
  const [bidangFilter, setBidangFilter] = React.useState('ALL');

  // Dialog states
  const [editData, setEditData] = React.useState<PegawaiFormData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [resetUser, setResetUser] = React.useState<{ id: string; name: string; username: string } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  // Confirm dialog state for toggle status
  const [toggleUser, setToggleUser] = React.useState<PegawaiItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);

  // Filtered data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.username && item.username.toLowerCase().includes(search.toLowerCase())) ||
        (item.nip && item.nip.includes(search));

      const matchBidang = bidangFilter === 'ALL' || item.bidang === bidangFilter;

      return matchSearch && matchBidang;
    });
  }, [data, search, bidangFilter]);

  const handleToggleStatus = async () => {
    if (!toggleUser) return;
    setIsToggling(true);
    try {
      const newStatus = !toggleUser.aktif;
      await togglePegawaiStatusAction(toggleUser.id, newStatus);
      toast.success(
        newStatus
          ? `Akun @${toggleUser.username} berhasil diaktifkan.`
          : `Akun @${toggleUser.username} berhasil dinonaktifkan.`
      );
      setIsConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status akun.');
    } finally {
      setIsToggling(false);
    }
  };

  const columns: ColumnDef<PegawaiItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nama & Pengguna',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-text-primary">{row.original.name}</div>
          <div className="text-xs text-text-secondary">@{row.original.username || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'nip',
      header: 'NIP',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-secondary">
          {row.original.nip || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'bidang',
      header: 'Bidang Dinas',
      cell: ({ row }) => (
        <span className="font-sans text-xs font-medium uppercase px-2 py-0.5 rounded bg-muted text-text-primary">
          {row.original.bidang}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role Akses',
      cell: ({ row }) => (
        <span
          className={
            row.original.role === 'ADMIN'
              ? 'text-xs font-semibold text-primary'
              : 'text-xs text-text-secondary'
          }
        >
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'aktif',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.aktif && !row.original.banned ? 'AKTIF' : 'NONAKTIF'}
        />
      ),
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
                    setEditData({
                      id: item.id,
                      name: item.name,
                      username: item.username || '',
                      nip: item.nip,
                      bidang: item.bidang,
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4 text-text-secondary" />
                  <span>Ubah Data</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setResetUser({
                      id: item.id,
                      name: item.name,
                      username: item.username || '',
                    });
                    setIsResetDialogOpen(true);
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4 text-text-secondary" />
                  <span>Reset Password</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  destructive={item.aktif}
                  onClick={() => {
                    setToggleUser(item);
                    setIsConfirmOpen(true);
                  }}
                >
                  {item.aktif ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      <span>Nonaktifkan Akun</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4 text-success" />
                      <span>Aktifkan Akun</span>
                    </>
                  )}
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
                placeholder="Cari nama, username, NIP..."
                value={search}
                onChange={setSearch}
              />
            }
            filterSlot={
              <FilterSelect
                value={bidangFilter}
                onChange={setBidangFilter}
                placeholder="Bidang Dinas"
                allOptionLabel="Semua Bidang"
                options={[
                  { label: 'Sekretariat', value: 'SEKRETARIAT' },
                  { label: 'PTSP', value: 'PTSP' },
                  { label: 'Penanaman Modal (PM)', value: 'PM' },
                  { label: 'Pengawasan & Pengendalian', value: 'PENGAWASAN' },
                ]}
              />
            }
          />
        }
        columns={columns}
        data={filteredData}
        emptyTitle="Tidak Ada Pegawai"
        emptyDescription="Belum ada data pegawai yang sesuai filter."
      />

      <PegawaiFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={editData}
      />

      <ResetPasswordDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        user={resetUser}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={toggleUser?.aktif ? 'Nonaktifkan Akun Pegawai?' : 'Aktifkan Akun Pegawai?'}
        description={
          toggleUser?.aktif
            ? `Akun @${toggleUser?.username} akan dinonaktifkan dan seluruh sesi aktifnya akan dicabut seketika.`
            : `Akun @${toggleUser?.username} akan diaktifkan kembali dan dapat login ke sistem.`
        }
        confirmLabel={toggleUser?.aktif ? 'Nonaktifkan' : 'Aktifkan'}
        variant={toggleUser?.aktif ? 'destructive' : 'primary'}
        isLoading={isToggling}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
