import type { Metadata } from 'next';
import { dmSans, generalSans, jetbrainsMono } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | SIMOP DPMPTSP Karawang',
    default: 'SIMOP DPMPTSP - Kabupaten Karawang',
  },
  description:
    'Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang: Penjadwalan Tugas, Verifikasi Laporan, Inventaris & Tiket, Monitoring Retribusi PBG.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${generalSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-text-primary font-sans antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}

