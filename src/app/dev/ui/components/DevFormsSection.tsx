'use client';

import * as React from 'react';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';
import { FormField } from '@/components/shared/FormField';
import { FormSection } from '@/components/shared/FormSection';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { DatePicker } from '@/components/shared/DatePicker';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { FileDropzone } from '@/components/shared/FileDropzone';

export function DevFormsSection() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [date, setDate] = React.useState('2026-11-03');
  const [checkedRound, setCheckedRound] = React.useState(true);

  return (
    <Section
      title="3. Formulir & Kontrol Masukan"
      description="Input, Select, Textarea, Password, DatePicker, DateRangePicker, FileDropzone, Checkbox, dan Switch."
    >
      <Card className="p-6 space-y-6">
        <FormSection title="Input Teks & Validasi" description="State normal dan error dengan pesan ramah.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nama Lengkap Pegawai" required description="Masukkan nama sesuai KTP/SK.">
              <Input placeholder="Contoh: Ahmad Fauzi" />
            </FormField>

            <FormField label="Nomor Induk Pegawai (NIP)" error="NIP harus berupa 18 digit angka">
              <Input placeholder="19850101..." error />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kata Sandi Akun" required>
              <PasswordInput placeholder="Masukkan kata sandi..." />
            </FormField>

            <FormField label="Bidang Penugasan" required>
              <Select defaultValue="SEKRETARIAT">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bidang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEKRETARIAT">Sekretariat</SelectItem>
                  <SelectItem value="PTSP">Pelayanan Terpadu Satu Pintu (PTSP)</SelectItem>
                  <SelectItem value="PM">Penanaman Modal (PM)</SelectItem>
                  <SelectItem value="PENGAWASAN">Pengawasan & Pengendalian</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Catatan atau Keterangan Tambahan">
            <Textarea placeholder="Tuliskan keterangan bila diperlukan..." />
          </FormField>
        </FormSection>

        <FormSection title="Pemilih Tanggal (Calendar Pickers)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal Pelaksanaan Tunggal">
              <DatePicker value={date} onChange={setDate} />
            </FormField>

            <FormField label="Rentang Penugasan (Maks. 31 Hari)">
              <DateRangePicker
                startDate="2026-11-01"
                endDate="2026-11-15"
                onRangeChange={() => {}}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Pilihan & Toggle (Checkboxes & Switch)">
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Checkbox id="cb-standard" defaultChecked />
              <span>Standard Checkbox (Form & Tabel)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Checkbox
                variant="round"
                checked={checkedRound}
                onCheckedChange={(c) => setCheckedRound(Boolean(c))}
              />
              <span>Round Toggle (Preferensi Bot WA)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Switch defaultChecked />
              <span>Switch Status Aktif</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Unggah Berkas (FileDropzone)">
          <FileDropzone
            value={selectedFile}
            onChange={setSelectedFile}
            label="Unggah foto bukti kunjungan atau dokumen PDF"
            helperText="Format didukung: JPG, PNG, WEBP, PDF (Maksimal 5 MB)"
          />
        </FormSection>
      </Card>
    </Section>
  );
}

