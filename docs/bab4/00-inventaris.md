# 4.4 Inventarisasi Sistem SIMOP DPMPTSP Kabupaten Karawang

Dokumen ini menyajikan hasil inventarisasi menyeluruh terhadap basis kode (*codebase*) proyek Sistem Informasi Operasional dan Pelayanan (SIMOP) Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP) Kabupaten Karawang. Seluruh data yang disajikan diperoleh melalui penelusuran langsung (*reverse engineering*) terhadap berkas implementasi perangkat lunak tanpa penambahan asumsi di luar kode sumber.

---

## 4.4.1 Struktur Direktori Proyek

Aplikasi SIMOP DPMPTSP dibangun menggunakan arsitektur monolitik terpadu berbasis *framework* Next.js 16 (App Router) dengan TypeScript. Struktur direktori proyek menggabungkan logika *server* (Server Actions, Route Handlers, dan Drizzle ORM) bersama komponen antarmuka pengguna *client* (React 19, Radix UI, dan Tailwind CSS) ke dalam satu kesatuan pohon kode di bawah direktori `src/`.

Berikut merupakan gambaran pohon direktori utama proyek SIMOP DPMPTSP yang disajikan pada Cuplikan Kode 4.1.

```text
c:\Users\DELL 3420\Documents\jun\KP-SIMOP
├── .env.example                     # Contoh variabel lingkungan sistem
├── .env.local                       # Konfigurasi variabel lingkungan lokal
├── drizzle.config.ts                # Konfigurasi Drizzle Kit untuk migrasi PostgreSQL
├── next.config.ts                   # Konfigurasi kompilasi Next.js, HTTP Security Headers & CSP
├── package.json                     # Metadata paket, dependensi, dan skrip build/test
├── playwright.config.ts             # Konfigurasi pengujian end-to-end Playwright
├── tailwind.config.ts               # Pemetaan desain token Genesis ke kelas Tailwind CSS
├── tsconfig.json                    # Konfigurasi kompiler TypeScript
├── vercel.json                      # Konfigurasi deployment serverless Vercel (region sin1)
├── vitest.config.ts                 # Konfigurasi unit & integration test Vitest
├── docs/                            # Dokumentasi keputusan arsitektur dan desain
│   ├── DECISIONS.md                 # Keputusan arsitektural dan teknis (Fase 0 s.d. Fase C)
│   └── DESIGN.md                    # Panduan sistem desain Genesis DPMPTSP
├── drizzle/                         # Berkas SQL migrasi Drizzle ORM
│   ├── 0000_bored_the_hunter.sql    # Migrasi skema dasar awal
│   ├── 0001_lively_wonder_man.sql   # Penyesuaian tiket status MAINTENANCE & arsip barang
│   ├── 0002_canonical_pbg_schema.sql# Standardisasi skema retribusi PBG (no_skrd, nominal)
│   ├── 0003_plain_blink.sql         # Penambahan limit_stok barang & 4 lokasi_tipe jadwal
│   ├── 0004_canonical_jadwal_tanggal.sql # Migrasi tanggal kanonikal YYYY-MM-DD
│   └── meta/                        # Metadata snapshot skema Drizzle
├── scripts/                         # Skrip otomasi pemeriksaan kode
│   ├── check-tokens.mjs             # Validasi ketiadaan kode warna hex hardcoded
│   └── contrast.mjs                 # Validasi matematis kontras rasio WCAG 2.1 AA/AAA
├── tests/                           # Berkas pengujian unit dan integrasi database (Vitest)
├── e2e/                             # Berkas pengujian interaksi pengguna menyeluruh (Playwright)
└── src/
    ├── app/                         # Rute aplikasi berbasis Next.js App Router
    │   ├── layout.tsx               # Root layout penyedia tema (next-themes ThemeProvider)
    │   ├── page.tsx                 # Root redirection ke /dashboard atau /login
    │   ├── (auth)/                  # Kelompok rute publik autentikasi
    │   │   ├── layout.tsx           # Layout dasar halaman login
    │   │   └── login/page.tsx       # Halaman antarmuka masuk akun aparatur
    │   ├── (app)/                   # Kelompok rute terproteksi aplikasi internal dinas
    │   │   ├── layout.tsx           # Guard sesi terpusat & pembungkus AppShell
    │   │   ├── dashboard/page.tsx   # Dashboard peran terpadu (ADMIN & PEGAWAI)
    │   │   ├── admin/               # Rute khusus Administrator (layout guard: role ADMIN)
    │   │   │   ├── layout.tsx       # Guard proteksi role ADMIN
    │   │   │   ├── inventaris/      # Halaman pengelolaan barang, stok, dan tiket admin
    │   │   │   ├── jadwal/          # Halaman pengaturan penugasan jadwal kedinasan
    │   │   │   ├── pbg/             # Halaman monitoring retribusi PBG & SKRD
    │   │   │   ├── pegawai/         # Halaman manajemen data aparatur & akun dinas
    │   │   │   └── verifikasi/      # Halaman antrean verifikasi laporan tugas dinas
    │   │   └── pegawai/             # Rute khusus Pegawai aparatur
    │   │       ├── jadwal/          # Halaman linimasa jadwal tugas mandiri & unggah bukti
    │   │       ├── tiket/           # Halaman pengajuan tiket layanan & riwayat mandiri
    │   │       └── profil/          # Halaman profil identitas aparatur & ubah kata sandi
    │   ├── api/                     # Route Handlers HTTP API
    │   │   ├── auth/[...all]/       # Handler endpoint Better Auth (GET/POST)
    │   │   └── uploads/             # Layanan unggah dan pratinjau Cloudflare R2
    │   │       ├── sign/route.ts    # Penerbitan Presigned PUT URL S3/R2
    │   │       └── preview/route.ts # Penerbitan Presigned GET URL S3/R2 berumur pendek
    │   └── dev/ui/page.tsx          # Halaman galeri pengembang (404 pada mode production)
    ├── components/                  # Pustaka komponen visual antarmuka
    │   ├── layout/                  # Komponen rangka (AppShell, Sidebar, TopHeader, Drawer)
    │   ├── providers/               # Penyedia konteks tema gelap/terang (ThemeProvider)
    │   ├── shared/                  # Komponen domain terbagi (DataTable, StatCard, Chart, dsb.)
    │   └── ui/                      # Komponen primitif desain sistem Genesis (Radix UI)
    ├── config/                      # Konfigurasi statis aplikasi
    │   └── navigation.ts            # Konfigurasi menu sidebar & aksi cepat per peran
    ├── db/                          # Konfigurasi basis data Drizzle ORM
    │   ├── index.ts                 # Inisialisasi pool koneksi PostgreSQL (pg & Neon)
    │   ├── seed.ts                  # Seeder akun admin, staf dinas, barang, dan pengaturan
    │   └── schema/                  # Definisi skema tabel basis data
    │       ├── auth.ts              # Tabel autentikasi (users, sessions, accounts, rate_limits)
    │       ├── domain.ts            # Tabel operasional (jadwal, barang, tiket, stok_log, pbg, dsb.)
    │       ├── enums.ts             # Definisi enumerasi PostgreSQL (pgEnum)
    │       └── index.ts             # Ekspor gabungan skema
    ├── lib/                         # Modul utilitas dan pustaka pembantu
    │   ├── auth.ts                  # Inisialisasi instans Better Auth & konfigurasi plugin
    │   ├── auth-client.ts           # Klien Better Auth untuk komponen peramban
    │   ├── cn.ts                    # Utilitas penggabungan kelas Tailwind (clsx & twMerge)
    │   ├── dates.ts                 # Utilitas normalisasi tanggal kalender zona waktu WIB
    │   ├── env.ts                   # Validasi skema variabel lingkungan berbasis Zod
    │   ├── fonts.ts                 # Konfigurasi font General Sans, DM Sans, dan JetBrains Mono
    │   ├── session.ts               # Guard otorisasi server (requireAuth & requireRole)
    │   ├── storage.ts               # Integrasi AWS SDK S3 / Cloudflare R2 & verifikasi objek
    │   └── user-management.ts       # Manajemen penonaktifan atomik akun & pencabutan sesi
    ├── modules/                     # Modul fitur bisnis terisolasi
    │   ├── auth/                    # Modul autentikasi masuk akun aparatur
    │   ├── dashboard/               # Modul agregasi statistik & visualisasi performa dinas
    │   ├── inventaris/              # Modul katalog barang, penyesuaian stok & log mutasi
    │   ├── jadwal/                  # Modul generator jadwal rentang & pelaporan tugas
    │   ├── pbg/                     # Modul pencatatan retribusi PBG & deteksi jatuh tempo
    │   ├── pegawai/                 # Modul administrasi akun staf dinas & reset kata sandi
    │   ├── profil/                  # Modul informasi akun mandiri & mutasi kata sandi
    │   ├── search/                  # Modul pencarian cepat global berbasis perintah (Ctrl+K)
    │   ├── tiket/                   # Modul tiket permohonan sarana & perbaikan kerusakan
    │   └── verifikasi/              # Modul verifikasi bukti tugas oleh verifikator dinas
    └── styles/
        └── globals.css              # Definisi CSS variables token warna tema terang & gelap
```

Cuplikan Kode 4.1 di atas menunjukkan struktur arsitektur modular yang rapi, di mana setiap fitur bisnis dikelompokkan ke dalam direktori modul mandiri di bawah `src/modules/` yang memuat logika mutasi (*actions.ts*), kueri data (*queries.ts*), skema validasi (*schema.ts*), serta komponen antarmuka spesifik (*components/*). Struktur ini memisahkan secara tegas antara kode primitif UI bebas logika bisnis (`src/components/ui/`) dengan komponen domain operasional dinas.

---

## 4.4.2 Versi Pustaka Utama

Untuk memastikan keandalan lingkungan pengembangan dan kepatuhan terhadap standar industri, perangkat lunak SIMOP DPMPTSP menggunakan serangkaian pustaka dengan versi terdefinisi secara presisi.

Berikut merupakan rincian pustaka utama yang digunakan pada proyek SIMOP DPMPTSP yang disajikan pada Tabel 4.1.

**Tabel 4.1** Versi Pustaka Utama dan Ketergantungan Perangkat Lunak
| Kategori | Nama Paket (*Package*) | Versi | Sumber Bukti (*File:Baris*) | Peran dan Fungsi dalam Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **Framework Inti** | `next` | `^16.4.3` | [package.json:40](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L40) | Kerangka kerja aplikasi React full-stack (App Router, Server Actions, Route Handlers) |
| **Framework Inti** | `react` | `^19.0.0` | [package.json:43](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L43) | Pustaka dasar antarmuka pengguna berbasis komponen reaktif |
| **Framework Inti** | `react-dom` | `^19.0.0` | [package.json:44](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L44) | Pengendali rendering DOM untuk React 19 |
| **Autentikasi** | `better-auth` | `^1.2.9` | [package.json:34](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L34) | Mesin autentikasi aparatur, manajemen sesi cookie HTTP-only, proteksi brute force |
| **Autentikasi CLI** | `@better-auth/cli` | `^1.4.21` | [package.json:51](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L51) | Generator skema dan perkakas manajemen Better Auth |
| **Basis Data / ORM** | `drizzle-orm` | `^0.40.0` | [package.json:38](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L38) | *Object-Relational Mapping* (ORM) berbasis TypeScript dengan dukungan transaksi atomik |
| **Basis Data Tooling**| `drizzle-kit` | `^0.30.5` | [package.json:60](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L60) | Perangkat migrasi skema dan sinkronisasi struktur basis data PostgreSQL |
| **Driver Basis Data** | `pg` | `^8.13.3` | [package.json:42](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L42) | Driver koneksi PostgreSQL standar untuk pooling koneksi server |
| **Driver Basis Data** | `@neondatabase/serverless` | `^0.10.4` | [package.json:24](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L24) | Driver koneksi pooled serverless PostgreSQL untuk lingkungan produksi Neon |
| **Penyimpanan Cloud** | `@aws-sdk/client-s3` | `^3.758.0` | [package.json:21](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L21) | Klien protokol S3 untuk integrasi penyimpanan objek berkas Cloudflare R2 |
| **Penyimpanan Cloud** | `@aws-sdk/s3-request-presigner` | `^3.758.0` | [package.json:22](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L22) | Generator presigned URL PUT (unggah) dan GET (pratinjau) Cloudflare R2 |
| **Validasi Skema** | `zod` | `^3.24.2` | [package.json:48](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L48) | Validasi skema tipe statis dan waktu nyata (*runtime*) untuk input Server Actions & API |
| **Manajemen Form** | `react-hook-form` | `^7.54.2` | [package.json:45](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L45) | Pengendali formulir reaktif tanpa re-render berlebih pada antarmuka klien |
| **Manajemen Form** | `@hookform/resolvers` | `^4.1.3` | [package.json:23](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L23) | Jembatan integrasi antara skema validasi Zod dengan formulir React Hook Form |
| **Komponen Tabel** | `@tanstack/react-table` | `^8.21.2` | [package.json:33](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L33) | Komponen tabel nir-gaya (*headless table*) dengan fitur sortir, filter, dan paginasi |
| **Styling & Desain** | `tailwindcss` | `^3.4.17` | [package.json:64](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L64) | Kerangka styling berbasis kelas utilitas dengan integrasi variabel CSS Genesis |
| **Styling Animasi** | `tailwindcss-animate` | `^1.0.7` | [package.json:65](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L65) | Ekstensi animasi transisi Tailwind untuk dialog modal dan drawer navigasi |
| **Penyedia Tema** | `next-themes` | `^0.4.6` | [package.json:41](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L41) | Penyedia konteks tema gelap (*dark mode*) dan tema terang (*light mode*) bebas FOUT |
| **Ikon Antarmuka** | `lucide-react` | `^0.479.0` | [package.json:39](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L39) | Pustaka ikon SVG modular konsisten untuk elemen tombol dan indikator status |
| **Pencarian Cepat** | `cmdk` | `^1.0.4` | [package.json:37](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L37) | Dialog palet perintah pencarian terindeks dengan kombinasi tombol Ctrl/Cmd+K |
| **Notifikasi Toast** | `sonner` | `^2.0.1` | [package.json:46](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L46) | Komponen toast notifikasi umpan balik interaksi pengguna |
| **Pengujian Unit** | `vitest` | `^3.0.8` | [package.json:69](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L69) | Lingkungan pengujian unit dan integrasi berkecepatan tinggi |
| **Pengujian E2E** | `@playwright/test` | `^1.51.0` | [package.json:53](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L53) | Otomasi pengujian fungsionalitas lintas peramban (*browser testing*) |
| **Bahasa & Compiler**| `typescript` | `^5.8.2` | [package.json:67](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/package.json#L67) | *Superset* JavaScript dengan pengetikan statis ketat (*type safety*) |

Berdasarkan Tabel 4.1, terlihat bahwa arsitektur perangkat lunak SIMOP DPMPTSP telah menggunakan versi stabil terkini, dengan fondasi Next.js 16 dan React 19. Pemilihan Drizzle ORM versi 0.40.0 dan Better Auth 1.2.9 menggantikan pola arsitektur terdahulu (seperti Express atau Prisma) guna memperoleh eksekusi kueri langsung tanpa beban overhead binary engine, serta mendukung transaksi interaktif ACID PostgreSQL secara penuh.

---

## 4.4.3 Inventaris Rute Endpoint API dan Server Actions

Dalam arsitektur Next.js 16 App Router, operasi mutasi data dan pengambilan data tidak hanya dilayani melalui endpoint HTTP konvensional (*Route Handlers*), melainkan secara dominan ditangani oleh *Server Actions* yang bertindak sebagai antarmuka RPC (*Remote Procedure Call*) yang dieksekusi langsung di lingkungan *server*.

Berikut merupakan inventaris lengkap rute HTTP Route Handlers dan Server Actions pada sistem SIMOP DPMPTSP yang disajikan pada Tabel 4.2.

**Tabel 4.2** Inventaris Endpoint API dan Server Actions SIMOP DPMPTSP
| Metode / Tipe | Jalur Pemanggilan (*Path / Function*) | Berkas Sumber (*File:Baris*) | Guard / Middleware Otorisasi | Fungsi Pengendali (*Handler*) | Peran dan Operasi Bisnis | Status Terhubung |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HTTP GET/POST** | `/api/auth/[...all]` | [src/app/api/auth/[...all]/route.ts:4](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/api/auth/%5B...all%5D/route.ts#L4) | Internal Better Auth Rate Limiter | `toNextJsHandler(auth)` | Menangani login kredensial, verifikasi sesi cookie, dan pergantian password | [LENGKAP] |
| **HTTP POST** | `/api/uploads/sign` | [src/app/api/uploads/sign/route.ts:19](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/api/uploads/sign/route.ts#L19) | `requireRole(['PEGAWAI', 'ADMIN'], {checkDbActive: true})` | `POST(req)` | Menerbitkan Presigned PUT URL Cloudflare R2 untuk unggah bukti tugas (maks 5 MB) | [LENGKAP] |
| **HTTP GET** | `/api/uploads/preview` | [src/app/api/uploads/preview/route.ts:8](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/api/uploads/preview/route.ts#L8) | `requireAuth({checkDbActive: true})` | `GET(req)` | Menerbitkan Presigned GET URL Cloudflare R2 berumur pendek (300 detik) untuk pratinjau bukti | [LENGKAP] |
| **Server Action** | `createPegawaiAction` | [src/modules/pegawai/actions.ts:20](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/actions.ts#L20) | `requireRole(['ADMIN'])` | `createPegawaiAction(input)` | Mendaftarkan aparatur pegawai baru, email sintetis, dan hashing kata sandi akun | [LENGKAP] |
| **Server Action** | `updatePegawaiAction` | [src/modules/pegawai/actions.ts:66](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/actions.ts#L66) | `requireRole(['ADMIN'])` | `updatePegawaiAction(input)` | Memperbarui nama lengkap, penugasan bidang dinas, dan NIP aparatur | [LENGKAP] |
| **Server Action** | `resetPegawaiPasswordAction` | [src/modules/pegawai/actions.ts:85](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/actions.ts#L85) | `requireRole(['ADMIN'])` | `resetPegawaiPasswordAction(input)` | Mereset kata sandi pegawai oleh Admin dan mencabut seluruh sesi aktif seketika | [LENGKAP] |
| **Server Action** | `togglePegawaiStatusAction` | [src/modules/pegawai/actions.ts:107](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/actions.ts#L107) | `requireRole(['ADMIN'])` | `togglePegawaiStatusAction(id, setAktif, reason)` | Mengaktifkan/menonaktifkan akun pegawai, memblokir akses, dan menghapus sesi aktif | [LENGKAP] |
| **Server Action** | `createBarangAction` | [src/modules/inventaris/actions.ts:21](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/actions.ts#L21) | `requireRole(['ADMIN'])` | `createBarangAction(input)` | Menambahkan item inventaris/ATK baru dan mencatat stok awal ke stok_log | [LENGKAP] |
| **Server Action** | `updateBarangAction` | [src/modules/inventaris/actions.ts:67](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/actions.ts#L67) | `requireRole(['ADMIN'])` | `updateBarangAction(input)` | Memperbarui nama barang, kategori, limit stok minimum, dan deskripsi | [LENGKAP] |
| **Server Action** | `adjustStokAction` | [src/modules/inventaris/actions.ts:93](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/actions.ts#L93) | `requireRole(['ADMIN'])` | `adjustStokAction(input)` | Mutasi penyesuaian stok fisik (MASUK/KELUAR) dengan pencatatan audit stok_log | [LENGKAP] |
| **Server Action** | `deleteOrArchiveBarangAction` | [src/modules/inventaris/actions.ts:186](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/actions.ts#L186) | `requireRole(['ADMIN'])` | `deleteOrArchiveBarangAction(id)` | Menghapus permanen jika tanpa riwayat, atau mengarsipkan aman jika memiliki tiket/log | [LENGKAP] |
| **Server Action** | `restoreBarangAction` | [src/modules/inventaris/actions.ts:246](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/actions.ts#L246) | `requireRole(['ADMIN'])` | `restoreBarangAction(id)` | Memulihkan status barang yang sebelumnya diarsipkan agar aktif kembali | [LENGKAP] |
| **Server Action** | `createJadwalRangeAction` | [src/modules/jadwal/actions.ts:27](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/actions.ts#L27) | `requireRole(['ADMIN'])` | `createJadwalRangeAction(input)` | Membuat jadwal tugas rentang tanggal untuk banyak pegawai (maks rentang 31 hari) | [LENGKAP] |
| **Server Action** | `deleteJadwalAction` | [src/modules/jadwal/actions.ts:76](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/actions.ts#L76) | `requireRole(['ADMIN'])` | `deleteJadwalAction(id)` | Menghapus penugasan (dilarang jika sudah SELESAI) dan membersihkan berkas bukti di R2 | [LENGKAP] |
| **Server Action** | `submitLaporanAction` | [src/modules/jadwal/actions.ts:126](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/actions.ts#L126) | `requireRole(['PEGAWAI', 'ADMIN'])` | `submitLaporanAction(input)` | Mengirimkan laporan bukti foto wajib dan PDF opsional dengan verifikasi integritas R2 | [LENGKAP] |
| **Server Action** | `verifikasiJadwalAction` | [src/modules/verifikasi/actions.ts:16](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/verifikasi/actions.ts#L16) | `requireRole(['ADMIN'])` | `verifikasiJadwalAction(input)` | Keputusan verifikator: ACC (status jadi SELESAI) atau TOLAK (kembali BELUM_DIKERJAKAN) | [LENGKAP] |
| **Server Action** | `createTiketAction` | [src/modules/tiket/actions.ts:20](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/actions.ts#L20) | `requireAuth()` | `createTiketAction(input)` | Mengajukan tiket permohonan ATK atau laporan kerusakan dengan nomor format TKT-YYYYMMDD-XXXX | [LENGKAP] |
| **Server Action** | `accTiketAction` | [src/modules/tiket/actions.ts:81](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/actions.ts#L81) | `requireRole(['ADMIN'])` | `accTiketAction(params)` | Persetujuan tiket: klaim atomik baris tiket & pemotongan stok barang otomatis via transaksi SQL | [LENGKAP] |
| **Server Action** | `updateTiketStatusAction` | [src/modules/tiket/actions.ts:169](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/actions.ts#L169) | `requireRole(['ADMIN'])` | `updateTiketStatusAction(input)` | Pembaruan status tiket layanan (TOLAK, MAINTENANCE, SELESAI) dengan validasi transisi | [LENGKAP] |
| **Server Action** | `createPbgAction` | [src/modules/pbg/actions.ts:19](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L19) | `requireRole(['ADMIN'], {checkDbActive: true})` | `createPbgAction(input)` | Mencatat ketetapan retribusi PBG baru, normalisasi nomor WhatsApp 628xxx & validasi unik SKRD | [LENGKAP] |
| **Server Action** | `updatePbgAction` | [src/modules/pbg/actions.ts:60](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L60) | `requireRole(['ADMIN'], {checkDbActive: true})` | `updatePbgAction(input)` | Memperbarui data tagihan retribusi PBG, pemohon, nominal, dan tanggal jatuh tempo | [LENGKAP] |
| **Server Action** | `markPbgLunasAction` | [src/modules/pbg/actions.ts:102](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L102) | `requireRole(['ADMIN'], {checkDbActive: true})` | `markPbgLunasAction(id)` | Menandai tagihan menjadi LUNAS dan merekam stempel waktu presisi pada kolom dibayar_pada | [LENGKAP] |
| **Server Action** | `unmarkPbgLunasAction` | [src/modules/pbg/actions.ts:148](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L148) | `requireRole(['ADMIN'], {checkDbActive: true})` | `unmarkPbgLunasAction(id)` | Membatalkan status pelunasan menjadi BELUM_BAYAR dan mengosongkan nilai dibayar_pada | [LENGKAP] |
| **Server Action** | `deletePbgAction` | [src/modules/pbg/actions.ts:186](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L186) | `requireRole(['ADMIN'], {checkDbActive: true})` | `deletePbgAction(id)` | Menghapus permanen rekaman data tagihan retribusi PBG dari basis data | [LENGKAP] |
| **Server Action** | `getPbgFullContactAction` | [src/modules/pbg/actions.ts:214](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/actions.ts#L214) | `requireRole(['ADMIN'], {checkDbActive: true})` | `getPbgFullContactAction(id)` | Mengambil nomor WhatsApp pemohon utuh tanpa sensor untuk kebutuhan formulir penyuntingan | [LENGKAP] |
| **Server Action** | `changePasswordAction` | [src/modules/profil/actions.ts:8](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/profil/actions.ts#L8) | `requireAuth({checkDbActive: true})` | `changePasswordAction(input)` | Mengubah kata sandi pengguna mandiri dan mencabut sesi di perangkat lain | [LENGKAP] |
| **Server Action** | `globalSearchAction` | [src/modules/search/actions.ts:26](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/search/actions.ts#L26) | `requireAuth()` | `globalSearchAction(query)` | Pencarian cepat Cmd+K berperingkat (maks 8 hasil) dengan isolasi data berbasis peran | [LENGKAP] |

Pada Tabel 4.2 terlihat bahwa seluruh operasi bisnis mutasi data SIMOP DPMPTSP dilindungi oleh pemeriksaan ganda: validasi skema waktu-nyata melalui pustaka Zod (`safeParse`/`parse`) dan otorisasi ketat di tingkat server melalui fungsi `requireRole()` atau `requireAuth()`. Setiap aksi Server Action langsung memicu `revalidatePath()` agar data antarmuka yang disajikan kepada aparatur selalu berada dalam kondisi terkini (*cache revalidation*).

---

## 4.4.4 Inventaris Halaman dan Komponen Frontend

Sisi antarmuka pengguna SIMOP DPMPTSP dirancang menggunakan konsep arsitektur berlapis, di mana halaman tingkat atas (`page.tsx`) berperan sebagai *Server Component* yang efisien, sedangkan interaktivitas pengguna ditangani oleh komponen klien (*Client Components*) di bawah folder modul masing-masing.

Berikut merupakan inventaris halaman antarmuka pengguna dan komponen modul pada sistem SIMOP DPMPTSP yang disajikan pada Tabel 4.3.

**Tabel 4.3** Inventaris Halaman Antarmuka dan Rute Frontend SIMOP DPMPTSP
| Rute Antarmuka (*URL Path*) | Berkas Halaman (*Page Component*) | Batasan Akses (*Role Access*) | Komponen Utama yang Digunakan | Server Action / Query yang Dipanggil | Deskripsi Fungsionalitas Layar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | [src/app/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/page.tsx) | Publik / Sesi | N/A (Redirect Logic) | `getServerSession()` | Rute akar yang mengarahkan otomatis pengguna terautentikasi ke `/dashboard` atau tamu ke `/login` |
| `/login` | [src/app/(auth)/login/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(auth)/login/page.tsx) | Publik (Tamu) | `LoginForm.tsx`, `AuthLayout.tsx` | `signIn.username()` (Better Auth) | Formulir masuk sistem aparatur dengan verifikasi username dan kata sandi |
| `/dashboard` | [src/app/(app)/dashboard/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/dashboard/page.tsx) | `ADMIN`, `PEGAWAI` | `AdminDashboard.tsx`, `PegawaiDashboard.tsx`, `DonutChart.tsx`, `StatCard.tsx`, `ProgressRing.tsx` | `getAdminDashboardStats()`, `getPegawaiDashboardStats()` | Dashboard terpadu: metrik harian & alert untuk Admin, atau capaian tugas mingguan untuk Pegawai |
| `/admin/pegawai` | [src/app/(app)/admin/pegawai/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/pegawai/page.tsx) | `ADMIN` | `PegawaiTable.tsx`, `PegawaiFormDialog.tsx`, `ResetPasswordDialog.tsx`, `ConfirmDialog.tsx` | `getPegawaiList()`, `createPegawaiAction`, `updatePegawaiAction`, `resetPegawaiPasswordAction`, `togglePegawaiStatusAction` | Pengelolaan data aparatur, pembuatan akun baru, penonaktifan akun staf, dan reset kata sandi |
| `/admin/jadwal` | [src/app/(app)/admin/jadwal/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/jadwal/page.tsx) | `ADMIN` | `JadwalAdminTable.tsx`, `JadwalFormDialog.tsx`, `JadwalHeaderActions.tsx`, `ConfirmDialog.tsx` | `getJadwalAdminList()`, `getActivePegawaiOptions()`, `createJadwalRangeAction`, `deleteJadwalAction` | Pengaturan penugasan kedinasan, generator rentang tanggal multi-pegawai, dan filter status jadwal |
| `/admin/verifikasi`| [src/app/(app)/admin/verifikasi/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/verifikasi/page.tsx) | `ADMIN` | `VerifikasiQueue.tsx`, `VerifikasiCard.tsx`, `VerifikasiDialog.tsx`, `FilePreview.tsx` | `getVerifikasiQueue()`, `verifikasiJadwalAction`, `/api/uploads/preview` | Antrean laporan tugas dinas menunggu verifikasi, peninjauan bukti foto/PDF, dan keputusan ACC/TOLAK |
| `/admin/inventaris`| [src/app/(app)/admin/inventaris/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/inventaris/page.tsx) | `ADMIN` | `InventarisTabs.tsx`, `BarangTable.tsx`, `StokLogTable.tsx`, `TiketAdminTable.tsx`, `BarangFormDialog.tsx`, `AdjustStokDialog.tsx` | `getBarangList()`, `getStokLogHistory()`, `getTiketAdminList()`, `createBarangAction`, `updateBarangAction`, `adjustStokAction`, `deleteOrArchiveBarangAction`, `accTiketAction`, `updateTiketStatusAction` | Pengelolaan katalog barang ATK/aset, audit mutasi penyesuaian stok fisik, dan pemrosesan tiket |
| `/admin/pbg` | [src/app/(app)/admin/pbg/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/pbg/page.tsx) | `ADMIN` | `PbgTable.tsx`, `PbgFormDialog.tsx`, `PbgHeaderActions.tsx`, `ConfirmDialog.tsx` | `getPbgList()`, `createPbgAction`, `updatePbgAction`, `markPbgLunasAction`, `unmarkPbgLunasAction`, `deletePbgAction`, `getPbgFullContactAction` | Pencatatan ketetapan retribusi PBG, kontrol pelunasan SKRD, filter jatuh tempo H-3, dan hapus data |
| `/pegawai/jadwal` | [src/app/(app)/pegawai/jadwal/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/jadwal/page.tsx) | `PEGAWAI`, `ADMIN` | `JadwalPegawaiTimeline.tsx`, `SubmitLaporanDialog.tsx`, `FileDropzone.tsx`, `FilePreview.tsx` | `getJadwalPegawaiList()`, `submitLaporanAction`, `/api/uploads/sign`, `/api/uploads/preview` | Linimasa penugasan mandiri aparatur, indikator catatan revisi verifikator, dan dialog unggah bukti |
| `/pegawai/tiket` | [src/app/(app)/pegawai/tiket/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/tiket/page.tsx) | `PEGAWAI`, `ADMIN` | `TiketPegawaiList.tsx`, `TiketFormDialog.tsx` | `getTiketPegawaiList()`, `getActiveBarangOptions()`, `createTiketAction` | Riwayat pengajuan tiket mandiri pegawai dan formulir permohonan ATK atau laporan kerusakan aset |
| `/pegawai/profil`| [src/app/(app)/pegawai/profil/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/profil/page.tsx) | `PEGAWAI`, `ADMIN` | `ProfilView.tsx`, `PasswordInput.tsx` | `changePasswordAction` | Tampilan identitas kedinasan pegawai (mode baca) dan formulir mandiri perubahan kata sandi |
| `/dev/ui` | [src/app/dev/ui/page.tsx](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/dev/ui/page.tsx) | Lingkungan Pengembangan (*Dev Only*) | Seksi galeri komponen Genesis UI | N/A (Statis / Komponen Showcase) | Katalog galeri pengembang untuk seluruh token desain, tombol, badge, modal, tabel, dan diagram |

Tabel 4.3 menegaskan konsistensi antarmuka pengguna SIMOP DPMPTSP, di mana setiap kelompok pengguna dialihkan ke rute yang sesuai dengan wewenang perannya. Antarmuka `/dev/ui` secara khusus diproteksi dengan `notFound()` pada lingkungan produksi sehingga tidak dapat diakses publik saat aplikasi dideploy.

---

## 4.4.5 Inventaris Skema Basis Data dan Tipe Enumerasi

Basis data SIMOP DPMPTSP dikelola menggunakan Drizzle ORM yang terhubung ke basis data relasional PostgreSQL. Seluruh definisi tabel dan tipe enumerasi dipetakan secara deklaratif pada berkas TypeScript di dalam direktori `src/db/schema/`.

Berikut merupakan daftar tabel basis data relasional yang didefinisikan dalam kode sumber SIMOP DPMPTSP yang disajikan pada Tabel 4.4.

**Tabel 4.4** Inventaris Entitas Tabel Basis Data (Drizzle ORM & PostgreSQL)
| Nama Tabel Basis Data | Berkas Skema (*File:Baris*) | Kunci Utama (*Primary Key*) | Kunci Tamu (*Foreign Key*) & Relasi | Constraint Unik / Aturan Validasi Khusus | Peran Entitas dalam Sistem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `users` | [src/db/schema/auth.ts:4](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/auth.ts#L4) | `id` (text UUID) | - | `email` unique, `username` unique, default `role = 'PEGAWAI'`, default `aktif = true` | Menyimpan identitas aparatur, NIP, penugasan bidang dinas, serta status aktif/banned akun |
| `sessions` | [src/db/schema/auth.ts:25](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/auth.ts#L25) | `id` (text UUID) | `user_id` $\to$ `users.id` (CASCADE) | `token` unique | Menyimpan rekaman sesi login aktif aparatur beserta IP address dan user agent |
| `accounts` | [src/db/schema/auth.ts:41](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/auth.ts#L41) | `id` (text UUID) | `user_id` $\to$ `users.id` (CASCADE) | Provider `credential` | Menyimpan kredensial autentikasi pengguna berupa kata sandi yang telah di-hash |
| `verifications` | [src/db/schema/auth.ts:61](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/auth.ts#L61) | `id` (text UUID) | - | Pasangan identifier & value | Tabel standar Better Auth untuk token verifikasi email atau alur reset sandi luar |
| `rate_limits` | [src/db/schema/auth.ts:72](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/auth.ts#L72) | `id` (text UUID) | - | `key` unique | Menyimpan penghitung kuota request rate limiter secara persisten di database |
| `jadwal` | [src/db/schema/domain.ts:25](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L25) | `id` (text UUID) | `pegawai_id` $\to$ `users.id` (CASCADE), `diverifikasi_oleh_id` $\to$ `users.id` (SET NULL) | Kolom `tanggal` bertipe date kalender WIB; default `lokasi_tipe = 'KANTOR'`; default `status = 'BELUM_DIKERJAKAN'` | Mencatat jadwal penugasan kerja dinas aparatur per hari, referensi berkas bukti R2, dan verifikasi |
| `barang` | [src/db/schema/domain.ts:49](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L49) | `id` (text UUID) | - | `kode_barang` unique; `CHECK (stok >= 0)`; default `stok = 0`; default `limit_stok = 5` | Menyimpan katalog barang inventaris ATK dan aset sarana kantor dinas |
| `tiket` | [src/db/schema/domain.ts:75](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L75) | `id` (text UUID) | `pemohon_id` $\to$ `users.id` (CASCADE), `barang_id` $\to$ `barang.id` (RESTRICT) | `nomor_tiket` unique; default `status = 'MENUNGGU'` | Mencatat permohonan pengambilan ATK atau pelaporan kerusakan aset kantor oleh aparatur |
| `stok_log` | [src/db/schema/domain.ts:95](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L95) | `id` (text UUID) | `barang_id` $\to$ `barang.id` (CASCADE), `tiket_id` $\to$ `tiket.id` (SET NULL), `user_id` $\to$ `users.id` (CASCADE) | Menyimpan nilai riwayat `stok_sebelum` dan `stok_sesudah` secara presisi | Mencatat audit mutasi pergerakan kuantitas stok barang (masuk, keluar, penyesuaian) |
| `pbg` | [src/db/schema/domain.ts:116](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L116) | `id` (text UUID) | - | `no_skrd` unique; default `status = 'BELUM_BAYAR'`; kolom `jatuh_tempo` tipe date | Menyimpan ketetapan retribusi Persetujuan Bangunan Gedung (PBG) dan status pelunasan SKRD |
| `notifikasi_log` | [src/db/schema/domain.ts:132](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L132) | `id` (text UUID) | `pbg_id` $\to$ `pbg.id` (CASCADE) | `UNIQUE (pbg_id, jenis, jatuh_tempo_snapshot)` | Mencatat riwayat pengiriman notifikasi pengingat retribusi WhatsApp kepada pemohon |
| `pengaturan` | [src/db/schema/domain.ts:160](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L160) | `key` (text) | - | `key` primary key | Menyimpan parameter konfigurasi sistem dalam bentuk pasangan kunci dan nilai teks (*key-value*) |

Tabel 4.4 merangkum 12 tabel basis data yang membentuk fondasi sistem SIMOP DPMPTSP. Selain tabel, PostgreSQL secara khusus mengonfigurasikan tipe enumerasi (*pgEnum*) untuk menjamin integritas nilai pada kolom status dan kategori.

Berikut merupakan daftar tipe enumerasi PostgreSQL yang didefinisikan dalam kode sumber sistem yang disajikan pada Tabel 4.5.

**Tabel 4.5** Inventaris Tipe Enumerasi PostgreSQL
| Nama Tipe Enumerasi (*pgEnum*) | Nilai Sah yang Ditetapkan (*Allowed Enum Values*) | Berkas Sumber (*File:Baris*) | Kolom Tabel yang Menggunakan | Keterangan dan Penggunaan di Kode |
| :--- | :--- | :--- | :--- | :--- |
| `role` | `'ADMIN'`, `'PEGAWAI'` | [src/db/schema/enums.ts:3](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L3) | `users.role` | Menentukan wewenang aparatur dalam mengakses rute dan fungsionalitas sistem |
| `bidang` | `'SEKRETARIAT'`, `'PTSP'`, `'PM'`, `'PENGAWASAN'` | [src/db/schema/enums.ts:5](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L5) | `users.bidang` | Memetakan penempatan dinas staf aparatur di lingkungan dinas DPMPTSP Karawang |
| `lokasi_tipe` | `'LOKET'`, `'KECAMATAN'`, `'KANTOR'`, `'LAINNYA'` | [src/db/schema/enums.ts:12](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L12) | `jadwal.lokasi_tipe` | Klasifikasi lokasi pelaksanaan penugasan kerja aparatur |
| `jadwal_status` | `'BELUM_DIKERJAKAN'`, `'MENUNGGU_VERIFIKASI'`, `'SELESAI'`, `'DITOLAK'` | [src/db/schema/enums.ts:19](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L19) | `jadwal.status` | Status alur penugasan (catatan: nilai DITOLAK tidak aktif dalam siklus transisi kode) |
| `barang_kategori` | `'ATK'`, `'ASET'` | [src/db/schema/enums.ts:26](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L26) | `barang.kategori` | Klasifikasi barang inventaris (Alat Tulis Kantor habis pakai vs Aset sarana kantor) |
| `tiket_jenis` | `'PERMINTAAN_BARANG'`, `'LAPOR_KERUSAKAN'` | [src/db/schema/enums.ts:28](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L28) | `tiket.jenis` | Jenis layanan tiket mandiri yang diajukan oleh staf pegawai dinas |
| `tiket_status` | `'MENUNGGU'`, `'ACC'`, `'MAINTENANCE'`, `'DITOLAK'`, `'SELESAI'` | [src/db/schema/enums.ts:33](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L33) | `tiket.status` | Status tahapan penanganan tiket permohonan perlengkapan dan perbaikan aset |
| `stok_tipe` | `'MASUK'`, `'KELUAR'`, `'PENYESUAIAN'` | [src/db/schema/enums.ts:41](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L41) | `stok_log.tipe` | Tipe mutasi pergerakan barang pada log audit persediaan inventaris |
| `pbg_status` | `'BELUM_BAYAR'`, `'LUNAS'` | [src/db/schema/enums.ts:47](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L47) | `pbg.status` | Status pembayaran kewajiban retribusi PBG atas ketetapan SKRD |
| `notifikasi_status`| `'TERKIRIM'`, `'GAGAL'` | [src/db/schema/enums.ts:52](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L52) | `notifikasi_log.status` | Status pengiriman pesan pada sistem log notifikasi (skema database) |
| `notifikasi_jenis` | `'PBG_JATUH_TEMPO_H_MIN_3'`, `'PBG_JATUH_TEMPO_HARI_H'` | [src/db/schema/enums.ts:57](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L57) | `notifikasi_log.jenis` | Klasifikasi pemicu notifikasi pengingat jatuh tempo tagihan retribusi PBG |

Tabel 4.5 memperlihatkan ketegasan batasan domain yang diterapkan langsung pada tingkat mesin PostgreSQL. Hal ini mencegah masuknya data anomali ke dalam basis data melalui validasi terpadu di lapisan skema basis data dan skema validasi Zod pada lapisan aplikasi.

---

## 4.4.6 Inventaris Konfigurasi Sistem dan Variabel Lingkungan

Konfigurasi runtime sistem SIMOP DPMPTSP dikendalikan melalui variabel lingkungan (*environment variables*) yang divalidasi pada berkas `src/lib/env.ts` menggunakan skema Zod. Hal ini menjamin sistem gagal dengan pesan kesalahan eksplisit saat startup (*fail-fast*) jika terdapat konfigurasi penting yang belum disetel.

Berikut merupakan inventaris variabel lingkungan yang digunakan oleh sistem SIMOP DPMPTSP yang disajikan pada Tabel 4.6.

**Tabel 4.6** Inventaris Variabel Lingkungan (*Environment Variables*)
| Kunci Variabel (*Key*) | Tipe & Aturan Validasi | Sifat (*Wajib / Opsional*) | Nilai Default / Contoh | Berkas Sumber (*File:Baris*) | Deskripsi dan Penggunaan dalam Sistem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String URL PostgreSQL | Wajib | `postgresql://...` (Neon pooler) | [src/lib/env.ts:4](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L4) | String koneksi utama basis data PostgreSQL Neon (mendukung pooled interactive transaction) |
| `DATABASE_URL_TEST` | String URL PostgreSQL | Opsional | `""` | [src/lib/env.ts:5](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L5) | String koneksi basis data terpisah khusus untuk eksekusi pengujian otomatis Vitest/E2E |
| `BETTER_AUTH_SECRET`| String minimal 1 karakter | Wajib | Kunci rahasia acak 32+ karakter | [src/lib/env.ts:6](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L6) | Kunci enkripsi tanda tangan cookie sesi dan hashing internal mesin Better Auth |
| `BETTER_AUTH_URL` | String URL sah | Opsional | `http://localhost:3000` | [src/lib/env.ts:7](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L7) | Alamat basis URL untuk resolusi endpoint internal Better Auth |
| `NEXT_PUBLIC_APP_URL`| String URL sah | Opsional | `http://localhost:3000` | [src/lib/env.ts:8](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L8) | Alamat domain publik aplikasi untuk resolusi tautan aset dan trusted origins |
| `R2_ACCOUNT_ID` | String | Opsional | ID akun Cloudflare | [src/lib/env.ts:9](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L9) | Identitas akun Cloudflare untuk pembentukan endpoint S3 R2 privat |
| `R2_ACCESS_KEY_ID` | String | Opsional | Kunci akses R2 | [src/lib/env.ts:10](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L10) | Kredensial Access Key ID untuk otorisasi API S3 Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY`| String | Opsional | Kunci rahasia R2 | [src/lib/env.ts:11](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L11) | Kredensial Secret Access Key untuk otorisasi API S3 Cloudflare R2 |
| `R2_BUCKET_NAME` | String | Opsional | `simop-bucket` | [src/lib/env.ts:12](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L12) | Nama bucket privat pada Cloudflare R2 tempat menampung foto bukti dan berkas PDF |
| `R2_PUBLIC_DOMAIN` | String | Opsional | `""` | [src/lib/env.ts:13](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L13) | Domain publik kustom R2 jika diaktifkan (pada kode privat diset kosong) |
| `FONNTE_TOKEN` | String | Opsional | `""` | [src/lib/env.ts:14](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L14) | Token API gateway WhatsApp Fonnte (fitur ditangguhkan sementara pada Fase 4) |
| `CRON_SECRET` | String | Opsional | `""` | [src/lib/env.ts:15](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L15) | Token Bearer otorisasi endpoint cron (fitur ditangguhkan sementara pada Fase 4) |
| `NODE_ENV` | Enum (`development`, `test`, `production`) | Opsional | `development` | [src/lib/env.ts:16](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L16) | Indikator lingkungan eksekusi aplikasi untuk optimasi build dan kebijakan keamanan CSP |

Tabel 4.6 memperlihatkan konfigurasi lingkungan yang fleksibel namun ketat. Pada lingkungan uji (*test*), berkas `src/lib/env.ts` menyediakan nilai fallback otomatis agar rangkaian pengujian unit dapat dieksekusi tanpa ketergantungan wajib pada kredensial produksi.

---

## 4.4.7 Inventaris File Kosong, Stub, Mock, dan Artefak Tidak Terhubung

Sebagai wujud kepatuhan terhadap prinsip *reverse engineering* yang faktual dan objektif, dilakukan audit khusus terhadap artefak kode yang belum terhubung penuh, bersifat *mock*, atau ditangguhkan dari spesifikasi awal.

Berikut merupakan daftar komponen *stub*, *mock*, dan artefak yang tidak terhubung dalam basis kode SIMOP DPMPTSP yang disajikan pada Tabel 4.7.

**Tabel 4.7** Inventaris Komponen *Stub*, *Mock*, dan Artefak Tidak Terhubung
| Komponen / Fitur / Artefak | Status di Kode Sumber | Berkas Bukti (*File:Baris*) | Fakta Temuan di Kode Sumber | Dampak terhadap Analisis Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **Bot WhatsApp Otomatis (Fonnte Gateway)** | `[TIDAK TERHUBUNG]` / `[DITANGGUHKAN]` | [docs/DECISIONS.md:121-128](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/docs/DECISIONS.md#L121-L128), [.env.example:39-40](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/.env.example#L39-L40) | Modul pengiriman WhatsApp (`WaSender`, `FonnteWaSender`) TIDAK DIBUAT di kode sumber; ditangguhkan pada Fase 4 demi stabilitas data PBG. | Fitur bot WhatsApp otomatis TIDAK DAPAT diklaim sebagai fitur aktif pada Kebutuhan Fungsional. |
| **Endpoint Pengingat Cron PBG (`/api/cron/pbg-reminder`)** | `[TIDAK DITEMUKAN DI KODE]` | [docs/DECISIONS.md:123](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/docs/DECISIONS.md#L123), [vercel.json:1-6](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/vercel.json#L1-L6) | Endpoint cron tidak dibuat pada direktori `src/app/api/` dan tidak ada jadwal cron pada `vercel.json`. | Sistem cron otomatisasi latar belakang TIDAK ADA dalam implementasi nyata. |
| **Tabel `notifikasi_log` & `pengaturan`** | `[SKEMA SAJA / TIDAK TERHUBUNG]` | [src/db/schema/domain.ts:132-164](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L132-L164), [src/db/seed.ts:167-197](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/seed.ts#L167-L197) | Dibuat pada skema Drizzle dan diisi data awal oleh seeder, namun tidak memiliki antarmuka atau logika mutasi pengiriman di aplikasi. | Dicatat murni sebagai entitas skema pasif untuk kesiapan fitur masa depan (*future readiness*). |
| **Nilai Enum `jadwal_status.DITOLAK`** | `[TIDAK DIPAKAI DALAM TRANSAKSI]` | [src/db/schema/enums.ts:23](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/enums.ts#L23), [src/modules/verifikasi/actions.ts:65-78](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/verifikasi/actions.ts#L65-L78) | Enum PostgreSQL memuat nilai `DITOLAK`, namun aksi `verifikasiJadwalAction` saat menolak laporan secara sengaja mengembalikan status ke `BELUM_DIKERJAKAN` dengan catatan revisi. | Nilai enum `DITOLAK` tidak pernah dicatat pada baris data jadwal operasional nyata. |
| **Fallback Mock URL Pratinjau R2** | `[MOCK]` (Kondisional) | [src/lib/storage.ts:211](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/storage.ts#L211) | Mengembalikan URL mock sintetis `https://mock-r2.simop.local/...` HANYA jika `NODE_ENV === 'test'` atau kredensial R2 belum dikonfigurasi. | Bukan *stub* permanen, melainkan *mock fallback* terisolasi untuk stabilitas pengujian unit. |
| **Fallback Mock Database URL** | `[MOCK]` (Kondisional) | [src/lib/env.ts:37](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/env.ts#L37) | Mengembalikan `postgresql://mock:mock@localhost:5432/mock` HANYA saat pengujian atau flag `SKIP_ENV_VALIDATION=1`. | Menjamin build dan pengujian TypeScript statis dapat berjalan tanpa akses jaringan ke basis data Neon. |
| **Halaman Galeri Komponen `/dev/ui`** | `[KHUSUS PENGEMBANG]` | [src/app/dev/ui/page.tsx:24-26](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/dev/ui/page.tsx#L24-L26) | Rute memanggil `notFound()` (HTTP 404) secara ketat jika aplikasi berada pada lingkungan produksi (`process.env.NODE_ENV === 'production'`). | Tidak dapat diakses oleh aparatur di lingkungan dinas produksi. |

Tabel 4.7 memberikan kejelasan faktual terhadap status fitur dalam laporan kerja praktik. Poin-poin ini menjadi dasar penting agar penyusunan Bab 4 terbebas dari klaim fiktif yang tidak didukung oleh keberadaan kode program yang berjalan.

---

## 4.4.8 Daftar Bukti Pemeriksaan Berkas

Berikut merupakan daftar seluruh berkas sumber yang diperiksa secara langsung dalam penyusunan subbab inventarisasi sistem ini:
1. `package.json` (baris 1–71)
2. `next.config.ts` (baris 1–74)
3. `vercel.json` (baris 1–6)
4. `.env.example` (baris 1–47)
5. `docs/DECISIONS.md` (baris 1–294)
6. `docs/DESIGN.md` (baris 1–280)
7. `src/db/schema/enums.ts` (baris 1–60)
8. `src/db/schema/auth.ts` (baris 1–86)
9. `src/db/schema/domain.ts` (baris 1–164)
10. `src/db/schema/index.ts` (baris 1–4)
11. `src/db/index.ts` (baris 1–65)
12. `src/db/seed.ts` (baris 1–209)
13. `src/lib/env.ts` (baris 1–59)
14. `src/lib/auth.ts` (baris 1–167)
15. `src/lib/session.ts` (baris 1–100)
16. `src/lib/storage.ts` (baris 1–222)
17. `src/lib/user-management.ts` (baris 1–109)
18. `src/lib/dates.ts` (baris 1–145)
19. `src/config/navigation.ts` (baris 1–185)
20. `src/app/api/auth/[...all]/route.ts` (baris 1–5)
21. `src/app/api/uploads/sign/route.ts` (baris 1–100)
22. `src/app/api/uploads/preview/route.ts` (baris 1–77)
23. `src/app/(app)/layout.tsx` (baris 1–42)
24. `src/app/(app)/admin/layout.tsx` (baris 1–30)
25. `src/app/(app)/dashboard/page.tsx` (baris 1–43)
26. `src/app/(app)/admin/pegawai/page.tsx` (baris 1–32)
27. `src/app/(app)/admin/jadwal/page.tsx` (baris 1–36)
28. `src/app/(app)/admin/verifikasi/page.tsx` (baris 1–31)
29. `src/app/(app)/admin/inventaris/page.tsx` (baris 1–41)
30. `src/app/(app)/admin/pbg/page.tsx` (baris 1–34)
31. `src/app/(app)/pegawai/jadwal/page.tsx` (baris 1–31)
32. `src/app/(app)/pegawai/tiket/page.tsx` (baris 1–38)
33. `src/app/(app)/pegawai/profil/page.tsx` (baris 1–28)
34. `src/app/(auth)/login/page.tsx` (baris 1–12)
35. `src/app/dev/ui/page.tsx` (baris 1–58)
36. `src/modules/pegawai/actions.ts` (baris 1–120)
37. `src/modules/pegawai/schema.ts` (baris 1–33)
38. `src/modules/pegawai/queries.ts` (baris 1–23)
39. `src/modules/inventaris/actions.ts` (baris 1–281)
40. `src/modules/inventaris/schema.ts` (baris 1–38)
41. `src/modules/inventaris/queries.ts` (baris 1–123)
42. `src/modules/jadwal/actions.ts` (baris 1–197)
43. `src/modules/jadwal/lib/generator.ts` (baris 1–129)
44. `src/modules/jadwal/schema.ts` (baris 1–26)
45. `src/modules/jadwal/queries.ts` (baris 1–137)
46. `src/modules/verifikasi/actions.ts` (baris 1–90)
47. `src/modules/verifikasi/schema.ts` (baris 1–27)
48. `src/modules/verifikasi/queries.ts` (baris 1–32)
49. `src/modules/tiket/actions.ts` (baris 1–217)
50. `src/modules/tiket/lib/transitions.ts` (baris 1–72)
51. `src/modules/tiket/schema.ts` (baris 1–22)
52. `src/modules/tiket/queries.ts` (baris 1–123)
53. `src/modules/pbg/actions.ts` (baris 1–240)
54. `src/modules/pbg/schema.ts` (baris 1–68)
55. `src/modules/pbg/queries.ts` (baris 1–131)
56. `src/modules/profil/actions.ts` (baris 1–40)
57. `src/modules/profil/schema.ts` (baris 1–19)
58. `src/modules/search/actions.ts` (baris 1–192)
59. `src/modules/dashboard/queries.ts` (baris 1–239)

