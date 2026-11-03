import * as React from 'react';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';

export function DevTypographySection() {
  return (
    <Section
      title="0. Skala Tipografi & Hirarki Visual (Typography & Hierarchy)"
      description="Standar tipografi Genesis: General Sans untuk display, DM Sans untuk body/UI, JetBrains Mono eksklusif untuk kode sistem."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scale Overview */}
        <Card className="p-6 space-y-5">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary pb-2 border-b border-border">
            Tingkatan Hirarki Teks
          </h4>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary block mb-1">
                Display Heading (24-30px &bull; font-display &bull; -0.03em)
              </span>
              <p className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-text-primary">
                Pusat Kendali Operasional
              </p>
            </div>

            <div>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary block mb-1">
                Title Card / Header Komponen (14-15px &bull; font-semibold)
              </span>
              <p className="text-sm font-semibold text-text-primary">
                Distribusi Penugasan & Status Dinas
              </p>
            </div>

            <div>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary block mb-1">
                Body Primary (14-15px &bull; font-sans &bull; text-text-primary)
              </span>
              <p className="text-sm text-text-primary leading-relaxed">
                Aparatur sipil negara DPMPTSP Kabupaten Karawang menjalankan tugas pelayanan terpadu satu pintu.
              </p>
            </div>

            <div>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary block mb-1">
                Meta / Subtitle / Deskripsi (12-13px &bull; text-text-secondary)
              </span>
              <p className="text-xs text-text-secondary">
                Batas minimum: 10 rim &bull; Terakhir diperbarui 5 menit yang lalu oleh verifikator
              </p>
            </div>

            <div>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary block mb-1">
                Overline / Category (11px &bull; uppercase &bull; tracking-wide &bull; font-sans)
              </span>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wide text-text-secondary">
                SEKRETARIAT &bull; PELAYANAN TERPADU
              </span>
            </div>
          </div>
        </Card>

        {/* Font Usage Rules (Sans vs Mono) */}
        <Card className="p-6 space-y-5">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary pb-2 border-b border-border">
            Aturan Eksklusif Font Mono vs Sans
          </h4>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-panel border border-border bg-muted/40 space-y-2">
              <span className="font-semibold text-text-primary block">
                ✅ font-mono HANYA untuk Identitas Kode & Angka Sistem:
              </span>
              <ul className="space-y-1.5 text-text-secondary list-disc list-inside">
                <li>
                  Nomor SKRD PBG:{' '}
                  <span className="font-mono font-semibold text-text-primary">
                    SKRD-2026-0042
                  </span>
                </li>
                <li>
                  Nomor Induk Pegawai (NIP):{' '}
                  <span className="font-mono text-text-primary">
                    198704152010011003
                  </span>
                </li>
                <li>
                  Kode Barang Inventaris:{' '}
                  <span className="font-mono text-text-primary">
                    BRG-001
                  </span>
                </li>
                <li>
                  Nomor Tiket Layanan:{' '}
                  <span className="font-mono font-semibold text-text-primary">
                    TKT-2026-0012
                  </span>
                </li>
                <li>
                  Keyboard Shortcut:{' '}
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-neutral">
                    ⌘K
                  </kbd>
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-panel border border-border bg-muted/40 space-y-2">
              <span className="font-semibold text-text-primary block">
                ❌ font-mono DILARANG pada Elemen Non-Kode (Wajib font-sans):
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-full text-2xs font-sans font-medium bg-surface border border-border text-text-secondary">
                  Badge: Hari Ini
                </span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-sans font-medium bg-surface border border-border text-text-secondary">
                  Badge: Aparatur
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium uppercase bg-surface border border-border text-text-secondary">
                  Tipe: LOKET
                </span>
                <span className="text-2xs font-sans font-medium uppercase tracking-wider text-text-secondary">
                  Grup Navigasi
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
