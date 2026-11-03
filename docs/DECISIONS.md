# Architectural & Technical Decisions - SIMOP DPMPTSP

Dokumen ini mencatat keputusan arsitektural dan teknis dalam pengembangan aplikasi SIMOP DPMPTSP (Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang).

---

## 1. Arsitektur Komponen & Larangan Duplikasi
- **Struktur Bertingkat**:
  1. `components/ui/`: Primitif shadcn/ui yang di-skin penuh sesuai `docs/DESIGN.md` (Genesis). Primitif ini tidak memiliki logika domain SIMOP.
  2. `components/layout/`: Kerangka layout (`AppShell`, `TopNav`, `NavLinks`, `UserMenu`, `MobileNavDrawer`, `PageContainer`, `PageHeader`, `Section`, `AuthLayout`). Navigasi dibaca dari data terpusat di `src/config/navigation.ts`.
  3. `components/shared/`: Komponen generik lintas fitur (Kartu, Tabel TanStack, Filter/Search, Form, Feedback/StatusBadge, Visualisasi ProgressRing/DonutChart/Timeline, CommandMenu, DotGrid, dll). Komponen shared menerima data via props dan tidak fetch data langsung.
  4. `modules/<fitur>/components/`: Komponen spesifik domain yang menyusun komponen shared dan primitives ui, memicu Server Actions untuk mutasi.
  5. `app/**/page.tsx`: Server Component tipis (target <= 60 baris), hanya mengambil data via `queries.ts` dan merender komponen modul.
- **Batasan Ukuran**: Komponen > 200 baris dipecah menjadi sub-komponen terfokus. Halaman dilarang mendefinisikan komponen inline.

---

## 2. Sistem Token & Gaya Visual (DESIGN.md Genesis)
- **Token CSS Variables**: Semua warna, radius, spacing, dan elevation shadow didefinisikan sebagai CSS variables di `src/styles/globals.css` dan dipetakan ke kelas Tailwind di `tailwind.config.ts`.
- **Pemeriksaan Otomatis**: Skrip `scripts/check-tokens.mjs` dijalankan via `pnpm check:tokens` untuk memastikan tidak ada hardcoded hex `#xxxxxx` di luar `globals.css`.
- **Warna & Semantik**:
  - `primary`: `#6366F1` (Indigo) dan `primary-hover`: `#4F46E5`. Indigo hanya dipakai untuk elemen interaktif (CTA, link, fokus, ring aktif), tidak pernah untuk teks status atau dekorasi.
  - `secondary`: Tombol transparan dengan border 1px (menggantikan hijau Genesis yang di-disable untuk SIMOP).
  - `text-primary`: `#0A0A0A`, `text-secondary`: `#6B6B6B`, `text-neutral`: `#9C9C9C`. Dilarang memakai `#000` atau `#FFF` untuk teks.
  - `background`: `#FAFAFA`, `surface`: `#FFFFFF`, `border`: `#E8E8EC`.
  - `status`: Pemetaan eksklusif pada `StatusBadge` (Hijau = SELESAI/LUNAS/ACC; Kuning = MENUNGGU/MENUNGGU_VERIFIKASI; Merah = DITOLAK/terlambat; Abu-abu = BELUM_DIKERJAKAN/MAINTENANCE/netral).
- **Tipografi**:
  - Heading: General Sans (self-hosted woff2, bold, tracking -0.03em s/d -0.04em).
  - Body & UI: DM Sans (Google Fonts, regular & medium).
  - Code & Identifiers: JetBrains Mono (Google Fonts).

---

## 3. Database & Transaksi Interaktif
- **Database**: PostgreSQL di Neon (Region Singapura `sin1`).
- **ORM & Driver**: Drizzle ORM dengan PostgreSQL pool connection (`@neondatabase/serverless` Pool atau `pg` pooled connection string) untuk mendukung transaksi interaktif (`db.transaction()`), khususnya operasi potong stok atomik pada ACC tiket barang. Driver `neon-http` dihindari karena tidak mendukung transaksi multi-pernyataan.

---

## 4. Autentikasi & Otorisasi
- **Better Auth**: Menggunakan plugin username dan admin. Registrasi publik dinonaktifkan (`signUp: { enabled: false }`).
- **Sesi**: Cookie httpOnly, strict session validation.
- **Otorisasi**: Fungsi `requireRole()` (`ADMIN` atau `PEGAWAI`) dipanggil pada tingkat Server Action dan fungsi query, bukan hanya di middleware/proxy.

---

## 5. Penyimpanan Berkas & Keamanan
- **Cloudflare R2**: Bucket privat S3-compatible.
- **Unggah Presigned**: Klien meminta presigned URL PUT melalui Route Handler `/api/uploads/sign`, yang memvalidasi hak akses, jadwal terkait, batas ukuran (5 MB), dan tipe MIME (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Berkas hanya dapat diakses melalui signed URL temporer dengan validasi kepemilikan.

---

## 6. Integrasi WhatsApp & Notifikasi PBG
- **Abstraksi `WaSender`**: Interface decoupled dengan implementasi `FonnteWaSender` untuk pengiriman produksi dan `ConsoleWaSender` untuk dev/testing/dry-run.
- **Cron Reminder**: Endpoint `/api/cron/pbg-reminder` diamankan dengan `Authorization: Bearer ${CRON_SECRET}`, berjalan setiap hari pukul 09.00 WIB (02.00 UTC) untuk memeriksa jatuh tempo H-3, dengan pencatatan riwayat unik di `notifikasi_log` untuk mencegah pengiriman duplikat.

---

## 7. Build Compiler & Dynamic Routing (Fase 0 Update)
- **Kompilasi Produksi (`next build --webpack`)**:
  Pada Windows dengan Next.js 16, Turbopack bawaan mengalami *panic/process crash* saat mengeksekusi webpack loader untuk berkas font lokal (`GeneralSans-*.woff2`) yang diproses bersama PostCSS. Menggunakan flag `--webpack` memberikan proses kompilasi yang stabil, bebas dari crash platform-specific, dan sangat cepat (~10 detik).
- **Rute Dinamis `src/app/dev/ui/page.tsx` (`export const dynamic = 'force-dynamic'`)**:
  Halaman galeri pengembang `/dev/ui` secara ketat memanggil `notFound()` saat aplikasi berada di environment `production` (`process.env.NODE_ENV === 'production'`). Karena Next.js mencoba melakukan SSG prerender seluruh halaman pada build time (di mana `NODE_ENV === 'production'`), pemanggilan `notFound()` tanpa konfigurasi dinamis akan memicu error prerender statis. Menetapkan `export const dynamic = 'force-dynamic'` memastikan halaman dievaluasi per-permintaan (request time), sehingga di production rute ini selalu merespons 404 tanpa merusak proses build statis.



---

## 8. Rate Limiting Persisten di Database & Resolusi IP Proxy Vercel (Fase 1 Update)
- **Penyimpanan Database**:
  Alih-alih in-memory storage yang rentan reset saat cold-start serverless instance, rate limiter Better Auth dikonfigurasikan dengan `storage: 'database'` menggunakan tabel `rate_limits` di PostgreSQL. Ini memastikan penghitungan kuota request bersifat persisten lintas instance serverless Vercel.
- **Batas Percobaan Masuk (10 Req/Menit)**:
  Batas login ditetapkan menjadi 10 percobaan per menit per IP pada endpoint `/sign-in/username` dan `/sign-in/email` untuk mencegah serangan brute-force credential stuffing.
- **Resolusi Alamat IP (`x-real-ip` + `x-forwarded-for`)**:
  Pada infrastruktur proxy Vercel, header `x-forwarded-for` dapat memuat daftar IP berantai (comma-separated). Better Auth mengabaikan header berantai bila tidak ada konfigurasi trusted proxies. Untuk menjamin akurasi IP klien riil tanpa spoofing, `advanced.ipAddress.ipAddressHeaders` diprioritaskan membaca header tunggal `x-real-ip` dari Vercel edge sebelum fallback ke `x-forwarded-for`.

---

## 9. Pembatasan Origin Terpercaya (`trustedOrigins`)
- **Penghapusan Wildcard**:
  Wildcard global `https://*.vercel.app` dihapus demi keamanan tingkat dinas untuk mencegah request forgery dari proyek Vercel milik pihak ketiga.
- **Origin Spesifik**:
  Origin yang diizinkan diambil secara eksplisit dari `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL`, `http://localhost:3000`, `VERCEL_PROJECT_PRODUCTION_URL`, serta domain preview spesifik proyek (`SIMOP_PREVIEW_DOMAIN`).

---

## 10. Tata Kelola Layout Terpusat & Guard Sesi `src/app/(app)/layout.tsx`
- **Pemisahan Tanggung Jawab**:
  Untuk mencegah duplikasi markup dan layout thrashing, `AppShell` HANYA dibungkus satu kali pada `src/app/(app)/layout.tsx`.
- **Guard Sesi Terpusat**:
  `src/app/(app)/layout.tsx` mengeksekusi `requireAuth()` secara terpusat untuk memverifikasi login dan status keaktifan user di database. Seluruh halaman anak di dalam rute `(app)` (seperti `/dashboard`, `/admin/pegawai`, dsb) dijamin telah melalui verifikasi sesi dan tidak boleh membungkus `AppShell` sendiri.

---

## 11. Mekanisme Atomik Penonaktifan Akun & Pencabutan Sesi
- **Fungsi `deactivateUser(userId, reason)`**:
  Menonaktifkan akun secara menyeluruh dengan mengupdate `user.aktif = false`, `banned = true`, mengisi `banReason`, dan mengeksekusi pembersihan seluruh sesi aktif pengguna di tabel `sessions`.
- **Proteksi Endpoint Admin**:
  Plugin admin Better Auth secara ketat mengonfigurasi `adminRoles: ['ADMIN']`. Role `PEGAWAI` ditolak (HTTP 403 `FORBIDDEN`) pada seluruh endpoint administratif (`/api/auth/admin/*`), dibuktikan secara otomatis melalui rangkaian test Vitest.

---

## 12. Modul Jadwal, Penyimpanan R2 Privat & Siklus Verifikasi Laporan (Fase 2 Update)
- **Bucket R2 Privat & Server-Generated Keys**:
  Bucket Cloudflare R2 dikonfigurasikan strictly private. Klien tidak pernah mengirim nama file kustom; Route Handler `/api/uploads/sign` menghasilkan key aman berformat `jadwal/{jadwalId}/{uuid}.{ext}`. Database hanya menyimpan `bukti_key` dan `pdf_key` (bukan URL permanen).
- **Pratinjau Terotorisasi Berumur Pendek (5 Menit)**:
  Pratinjau berkas privat dilayani melalui Route Handler `/api/uploads/preview?key=...` yang memverifikasi kepemilikan tugas atau role `ADMIN`, lalu menghasilkan signed GET URL berumur pendek (300 detik).
- **Pembersihan Berkas Otomatis Saat Revisi**:
  Jika laporan tugas pegawai sebelumnya ditolak (`TOLAK`) lalu pegawai mengunggah bukti perbaikan baru, Server Action `submitLaporanAction` secara otomatis memanggil `deleteR2Object()` untuk menghapus objek foto/PDF lama dari Cloudflare R2 guna mencegah penumpukan sampah berkas.
- **Generator Jadwal Rentang**:
  Fungsi domain `generateJadwalRange()` membatasi rentang maksimal 31 hari, menyediakan opsi `skipWeekends: true` (default) untuk melompati Sabtu & Minggu, menormalkan jam mulai/selesai dalam zona waktu WIB (08:00 - 16:00), dan mendukung penugasan multi-pegawai secara atomik.
- **Siklus Hidup Status & Aturan Penolakan**:
  Transisi status divalidasi ketat melalui `validateStatusTransition()`:
  1. `BELUM_DIKERJAKAN` $\to$ `MENUNGGU_VERIFIKASI` (pegawai mengirim bukti foto wajib $\le$ 5 MB dan PDF opsional).
  2. `MENUNGGU_VERIFIKASI` $\to$ `SELESAI` (admin menyetujui / ACC).
  3. `MENUNGGU_VERIFIKASI` $\to$ `BELUM_DIKERJAKAN` (admin menolak; WAJIB menyertakan `catatanVerifikator` minimal 5 karakter sebagai petunjuk perbaikan bagi pegawai).
- **Kontrak Halaman & Reduksi Efek Samping**:
  Seluruh halaman modul (`/admin/pegawai`, `/admin/jadwal`, `/admin/verifikasi`, `/pegawai/jadwal`) merupakan Server Component tipis ($\le 45$ baris) dengan `loading.tsx` dan `error.tsx`. Dialog formulir dipisahkan menjadi komponen konten ber-key untuk mengeliminasi efek samping cascading `setState` dalam `useEffect`.
