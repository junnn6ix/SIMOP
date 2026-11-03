'use client';

import * as React from 'react';
import { CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { VerifikasiCard } from './VerifikasiCard';
import { VerifikasiDialog, VerifikasiItem } from './VerifikasiDialog';

export interface VerifikasiQueueProps {
  initialItems: VerifikasiItem[];
}

export function VerifikasiQueue({ initialItems }: VerifikasiQueueProps) {
  const [search, setSearch] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<VerifikasiItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return initialItems;
    const term = search.toLowerCase();
    return initialItems.filter(
      (item) =>
        item.judul.toLowerCase().includes(term) ||
        item.pegawaiName.toLowerCase().includes(term) ||
        (item.pegawaiUsername && item.pegawaiUsername.toLowerCase().includes(term)) ||
        (item.alamatLokasi && item.alamatLokasi.toLowerCase().includes(term))
    );
  }, [initialItems, search]);

  const handleReview = (item: VerifikasiItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          placeholder="Cari laporan berdasarkan judul atau nama pegawai..."
          value={search}
          onChange={setSearch}
          className="w-full sm:w-80"
        />
        <div className="text-xs text-text-secondary">
          Antrean verifikasi: <span className="font-semibold text-primary">{filteredItems.length}</span> laporan
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="Tidak Ada Laporan Menunggu"
          description={
            search
              ? 'Tidak ada laporan yang sesuai dengan kata kunci pencarian.'
              : 'Semua laporan pelaksanaan tugas pegawai telah selesai diverifikasi.'
          }
          icon={<CheckSquare className="h-6 w-6 stroke-[1.5]" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <VerifikasiCard
              key={item.id}
              item={item}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      <VerifikasiDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={selectedItem}
      />
    </div>
  );
}
