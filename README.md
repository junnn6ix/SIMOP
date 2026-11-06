# SIMOP DPMPTSP
**Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang**

Aplikasi web internal modern untuk penjadwalan tugas aparatur sipil dinas, verifikasi laporan foto & dokumen dinas, manajemen inventaris (ATK/aset) beserta sistem tiket permohonan & kerusakan, serta monitoring retribusi Persetujuan Bangunan Gedung (PBG).

---

## 🛠️ Arsitektur & Tech Stack
- **Framework**: Next.js 16 (App Router, React Server Components, Server Actions, TypeScript Strict)
- **Desain & UI**: Genesis Design System (`docs/DESIGN.md`) dengan Tailwind CSS, shadcn/ui primitives ter-skin, class-variance-authority (cva), Lucide Icons, TanStack Table, Sonner Toast, cmdk (Command Menu), dan DotGrid canvas.
- **Basis Data**: PostgreSQL di Neon (Region Singapura `sin1`).
- **ORM & Driver**: Drizzle ORM + PostgreSQL connection pooler (`pg` Pool) untuk menjamin dukungan transaksi interaktif (`db.transaction()`) dan row-level locking pada klaim tiket inventaris.
- **Autentikasi & Otorisasi**: Better Auth (plugin username & admin) dengan penyimpanan rate-limit persisten di database PostgreSQL (10 req/menit per IP), session cookie httpOnly, proteksi brute-force via proxy header `x-real-ip`, serta pendaftaran publik dinonaktifkan secara ketat.
- **Penyimpanan Berkas**: Cloudflare R2 privat (S3-compatible API) dengan presigned URL berbatas waktu dan penegakan batas 5 MB pada tingkat server.
- **Pengujian**: Vitest (unit domain, konkurensi database nyata PostgreSQL, dan kebijakan Better Auth) + Playwright (smoke e2e).

---

## 📋 Checklist Environment Variables

| Variabel | Keterangan | Contoh / Nilai |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string PostgreSQL dengan **Connection Pooling** (Neon pooler) untuk runtime aplikasi serverless Next.js | `postgresql://user:pass@ep-*-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Connection string PostgreSQL langsung (direct/unpooled) untuk mengeksekusi Drizzle migrations / DDL schema | `postgresql://user:pass@ep-*.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_TEST` | Database terisolasi khusus pengujian (`neondb_test`). Pengujian otomatis menolak berjalan jika kosong atau sama dengan `DATABASE_URL` | `postgresql://user:pass@ep-*-pooler.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require` |
| `BETTER_AUTH_SECRET` | Kunci enkripsi sesi Better Auth (minimal 32 karakter acak) | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | URL absolut instans aplikasi Better Auth | `http://localhost:3000` / `https://simop.karawangkab.go.id` |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi web yang digunakan browser klien | `http://localhost:3000` / `https://simop.karawangkab.go.id` |
| `VERCEL_PROJECT_PRODUCTION_URL` | Domain produksi Vercel (tanpa protokol) untuk validasi CORS terpercaya | `simop-dpmptsp.vercel.app` |
| `R2_ACCOUNT_ID` | Cloudflare Account ID untuk bucket R2 privat | String ID akun Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID token R2 dengan izin Read & Write | Token API R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key token R2 | Secret API R2 |
| `R2_BUCKET_NAME` | Nama bucket Cloudflare R2 | `simop-dpmptsp-uploads` |
| `SEED_ADMIN_PASSWORD` | Password akun default `admin` saat seeder dijalankan | Password kuat pilihan admin |
| `SEED_PEGAWAI_PASSWORD` | Password akun pegawai bawaan saat seeder dijalankan | Password kuat pilihan dinas |
| `E2E_ADMIN_USERNAME` | Username pengujian E2E Playwright | `admin` |
| `E2E_ADMIN_PASSWORD` | Password pengujian E2E Playwright | Sesuai `SEED_ADMIN_PASSWORD` |
| `E2E_PEGAWAI_USERNAME` | Username pengujian E2E Playwright role pegawai | `pegawai_ptsp` |
| `E2E_PEGAWAI_PASSWORD` | Password pengujian E2E Playwright role pegawai | Sesuai `SEED_PEGAWAI_PASSWORD` |

---

## ☁️ Konfigurasi CORS Cloudflare R2
Untuk mengizinkan pengunggahan langsung berkas bukti laporan (foto & PDF) melalui presigned URL PUT dari browser klien ke Cloudflare R2, konfigurasi CORS bucket R2 wajib menyertakan aturan berikut:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://simop.karawangkab.go.id",
      "https://simop-dpmptsp.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 🚀 Memulai (Local Development)

### 1. Prasyarat
- Node.js >= 20.x
- pnpm >= 9.x

### 2. Instalasi Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Berkas Lingkungan
Salin `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```
Lengkapi nilai `DATABASE_URL` dan `DATABASE_URL_TEST` dari dashboard Neon Anda.

### 4. Eksekusi Migrasi Database
```bash
# Menjalankan migrasi skema Drizzle ke PostgreSQL
pnpm db:migrate
```

### 5. Seeding Data Awal
```bash
pnpm db:seed
```
*Catatan Keamanan Seeding:*
- Seeder membuat 1 akun `ADMIN` (`admin`) dan 3 akun `PEGAWAI` berbidang sah (`SEKRETARIAT`, `PTSP`, `PM`).
- Jika dijalankan di environment `production` (`NODE_ENV=production`), seeder secara otomatis **menolak berjalan** kecuali disertakan flag eksplisit `--force-production`.

### 6. Menjalankan Aplikasi
```bash
pnpm dev
```
Akses di `http://localhost:3000`. Kredensial bawaan admin: username `admin`, password sesuai yang dikonfigurasikan pada `SEED_ADMIN_PASSWORD`.

---

## 🧪 Validasi, Kualitas Kode & Pengujian

Aplikasi dilengkapi dengan rangkaian pengujian komprehensif tanpa kompromi:

```bash
# 1. Pengecekan Kepatuhan Token Desain (Genesis Design System)
# Memastikan 0 warna hardcoded hex di luar globals.css
pnpm check:tokens

# 2. Pengecekan Tipe Data TypeScript
pnpm typecheck

# 3. Linter Kode (ESLint flat config)
pnpm lint

# 4. Pengujian Otomatis (Vitest)
# Menguji generator jadwal rentang, transisi status tiket, verifikasi berkas R2,
# query stok menipis di SQL, ketahanan race-condition double-ACC pada PostgreSQL nyata,
# isolasi data pencarian global, serta kebijakan Better Auth
pnpm test

# 5. Playwright Smoke Test (E2E)
pnpm test:e2e

# 6. Kompilasi Produksi Next.js
pnpm build
```

---

## 🚀 Panduan Deployment ke Vercel (Langkah demi Langkah)

### Langkah 1: Persiapan Database Neon (PostgreSQL)
1. Buat project baru di [Neon Console](https://console.neon.tech) dengan Region **Asia Pacific (Singapore) `ap-southeast-1`**.
2. Salin connection string **Pooled** ke variabel `DATABASE_URL`.
3. Buat branch terpisah untuk pengujian (misal `neondb_test`) dan salin ke `DATABASE_URL_TEST`.

### Langkah 2: Persiapan Cloudflare R2
1. Buat bucket privat di [Cloudflare Dashboard](https://dash.cloudflare.com) > R2 Object Storage bernama `simop-dpmptsp-storage`.
2. Dapatkan API token R2 dengan izin `Object Read & Write`.
3. Di tab *Settings* bucket R2, masukkan konfigurasi CORS sesuai bagian [Konfigurasi CORS Cloudflare R2](#️-konfigurasi-cors-cloudflare-r2).

### Langkah 3: Menghubungkan Repository ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com) > **Add New Project** > Import repository SIMOP DPMPTSP.
2. Pengaturan Framework Preset: **Next.js**.
3. Build Command: `pnpm build` (atau biarkan default).
4. Pastikan `vercel.json` menyertakan `"regions": ["sin1"]` agar serverless function berada di region Singapura.

### Langkah 4: Memasukkan Environment Variables di Vercel
Pada bagian **Environment Variables** proyek Vercel, tambahkan seluruh key berikut untuk target *Production*:
- `DATABASE_URL`: Connection string PostgreSQL Neon pooled.
- `DATABASE_URL_TEST`: Connection string database test Neon.
- `BETTER_AUTH_SECRET`: String acak 32 karakter (dibuat via `openssl rand -hex 32`).
- `BETTER_AUTH_URL`: URL produksi (mis. `https://simop-dpmptsp.vercel.app`).
- `NEXT_PUBLIC_APP_URL`: URL produksi (mis. `https://simop-dpmptsp.vercel.app`).
- `VERCEL_PROJECT_PRODUCTION_URL`: Domain produksi tanpa protokol (mis. `simop-dpmptsp.vercel.app`).
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
- `SEED_ADMIN_PASSWORD`: Kata sandi kuat untuk akun administrator pertama.
- `SEED_PEGAWAI_PASSWORD`: Kata sandi awal untuk akun pegawai bawaan seeder.
- `E2E_ADMIN_USERNAME`: `admin`.
- `E2E_ADMIN_PASSWORD`: Sesuai `SEED_ADMIN_PASSWORD`.
- `NODE_ENV`: `production`.

### Langkah 5: Eksekusi Migrasi & Deploy
1. Klik tombol **Deploy** di Vercel.
2. Setelah deployment selesai, jalankan migrasi Drizzle dari CLI lokal Anda ke database produksi:
   ```bash
   DATABASE_URL="<DATABASE_URL_PRODUKSI>" pnpm db:migrate
   ```
3. Lakukan inisialisasi akun awal dengan seeder produksi:
   ```bash
   DATABASE_URL="<DATABASE_URL_PRODUKSI>" pnpm db:seed --force-production
   ```

---

## ✅ Checklist Verifikasi Pascadeploy (Operational Verification)

Setelah proses deployment selesai, lakukan pemeriksaan operasional berikut:

- [ ] **1. Halaman Autentikasi (`/login`)**:
  - Buka URL produksi di browser. Pastikan halaman login termuat bersih tanpa error CSP atau font gagal render.
  - Verifikasi bahwa teks peringatan *"Pendaftaran publik dinonaktifkan. Akun hanya dapat dibuat oleh administrator dinas."* tampil di bawah form.
- [ ] **2. Login Administrator**:
  - Masuk dengan username `admin` dan kata sandi yang dikonfigurasikan di `SEED_ADMIN_PASSWORD`.
  - Verifikasi pengalihan sukses ke `/dashboard` (Pusat Kendali Operasional).
- [ ] **3. Pengecekan Dashboard & StatCards**:
  - Pastikan StatCard (Pegawai Aktif, Penugasan Hari Ini, Tiket Menunggu, PBG Jatuh Tempo) menampilkan angka yang benar.
  - Periksa DonutChart distribusi penugasan hari ini menampilkan segmentasi lokasi: Kantor Dinas, Loket Pelayanan, Layanan Kecamatan, dan Lainnya/Lapangan.
- [ ] **4. Manajemen Aparatur Pegawai (`/admin/pegawai`)**:
  - Buka tabel pegawai, pastikan pegawai bawaan seeder tampil.
  - Buat 1 akun pegawai baru via tombol "Tambah Pegawai", lalu uji aksi "Reset Sandi" dan "Nonaktifkan Akun".
- [ ] **5. Penjadwalan & Verifikasi Laporan (`/admin/jadwal`)**:
  - Buat jadwal dinas baru untuk seorang pegawai dengan rentang 2 hari.
  - Login sebagai pegawai di jendela Incognito, buka `/pegawai/jadwal`.
  - Klik "Kirim Laporan", unggah foto bukti laporan dinas (JPG/PNG $\le$ 5 MB).
  - Pastikan presigned upload PUT langsung ke R2 berjalan sukses tanpa penolakan CORS/CSP.
  - Kembali ke sesi admin di `/admin/verifikasi`, klik "Tinjau Laporan", verifikasi pratinjau foto via signed GET URL berumur 5 menit, lalu klik "Setujui Laporan (ACC)".

### 🔍 Prosedur Verifikasi Manual Upload R2 Bebas Pelanggaran CSP
Untuk memastikan pengunggahan bukti laporan ke Cloudflare R2 berjalan lancar tanpa terblokir oleh Content Security Policy (`connect-src`):
1. Buka browser Developer Tools (F12) > tab **Console** dan tab **Network**.
2. Masuk sebagai pegawai (`/login`), navigasi ke menu **Tugas Saya** (`/pegawai/jadwal`).
3. Pada salah satu penugasan berstatus `BELUM_DIKERJAKAN`, klik **Kirim Laporan**.
4. Pilih berkas foto (JPG/PNG $\le$ 5 MB) dan klik unggah/kirim.
5. Periksa tab **Network**:
   - Request pertama: `POST /api/uploads/sign` (berstatus 200, mengembalikan URL PUT presigned Cloudflare R2).
   - Request kedua: `PUT https://<bucket-name>.<account-id>.r2.cloudflarestorage.com/jadwal/...` (berstatus 200).
6. Periksa tab **Console**:
   - Pastikan **TIDAK ADA** pesan merah pelanggaran CSP seperti `Refused to connect to 'https://...r2.cloudflarestorage.com' because it violates the following Content Security Policy directive: "connect-src..."`.
   - Host presisi R2 yang dikonfigurasikan di `next.config.ts` (`${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` dan `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`) menjamin browser mengizinkan transmisi upload langsung.
- [ ] **6. Inventaris ATK & Tiket Layanan (`/admin/inventaris` & `/pegawai/tiket`)**:
  - Sebagai pegawai, ajukan tiket permintaan barang (misal 2 rim Kertas HVS).
  - Sebagai admin di `/admin/inventaris`, setujui (ACC) tiket tersebut.
  - Pastikan stok barang terpotong secara atomik dan mutasi tercatat pada riwayat `stok_log`.
- [ ] **7. Monitoring Retribusi PBG (`/admin/pbg`)**:
  - Tambah ketetapan retribusi PBG baru dengan tanggal jatuh tempo H-2.
  - Verifikasi tagihan tersebut memicu penambahan hitungan pada AlertCard dashboard "PBG Jatuh Tempo $\le$ 3 Hari".
- [ ] **8. Pencarian Cepat Global (`CommandMenu` / Ctrl+K)**:
  - Tekan `Ctrl+K` atau `Cmd+K` di dashboard.
  - Lakukan pencarian nama pegawai, nama barang, atau nomor SKRD.
- [ ] **9. Keamanan Akun & Mandiri (`/pegawai/profil`)**:
  - Sebagai pegawai, buka menu profil di `/pegawai/profil`.
  - Ganti kata sandi. Pastikan perubahan berhasil dan sesi aktif di perangkat lain otomatis dicabut.

---

## 🛡️ Kebijakan Keamanan & Header HTTP
Aplikasi dikonfigurasi dengan header keamanan HTTP ketat pada `next.config.ts`:
- **Content-Security-Policy (CSP)**: Membatasi koneksi hanya ke origin aplikasi, Font Google/Fontshare, dan endpoint Cloudflare R2 presisi dari environment (`https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` dan `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`).
- **X-Frame-Options**: `DENY` (mencegah serangan clickjacking).
- **X-Content-Type-Options**: `nosniff` (mencegah MIME-sniffing).
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: Menonaktifkan kamera, mikrofon, dan geolokasi (`camera=(), microphone=(), geolocation=()`).
- **X-Robots-Tag**: `noindex, nofollow` (aplikasi web operasional internal pemerintahan, tidak diindeks mesin pencari publik).

---

## 📌 Panduan Otomatisasi Bot WhatsApp & Cron Pengingat PBG (Fase 4b)

Modul pengingat retribusi Persetujuan Bangunan Gedung (PBG) beroperasi secara otomatis melalui cron serverless dan dapat dipicu secara manual oleh Administrator.

### 1. Cara Mengaktifkan Bot WhatsApp
1. **Konfigurasi Environment Variable**:
   - Di Vercel atau `.env.local`, set variabel:
     ```env
     FONNTE_TOKEN="token_device_fonnte_anda"
     CRON_SECRET="kunci_rahasia_bearer_token_acak_minimal_32_karakter"
     ```
   - Catatan: Pada lingkungan production, `CRON_SECRET` wajib diisi demi keamanan *fail-closed*. Jika `FONNTE_TOKEN` belum diatur atau kosong, sistem secara otomatis beralih ke mode **Dry-Run** (simulasi pencatatan di basis data tanpa memotong kuota gateway).
2. **Aktivasi Antarmuka**:
   - Masuk sebagai Administrator ke halaman `/admin/pbg`.
   - Pilih tab **Pengaturan Bot WA**.
   - Aktifkan toggle **Status Otomatisasi Bot WhatsApp** dan klik tombol **Simpan Pengaturan**.
3. **Uji Coba Awal**:
   - Daftarkan satu data tagihan uji coba dengan nomor kontak WhatsApp Anda sendiri.
   - Buka menu aksi baris tagihan pada tabel PBG lalu klik **Kirim Pengingat WA**.
   - Verifikasi bahwa pesan diterima dan status log tercatat pada tab **Riwayat Pengiriman**.

### 2. Jadwal & Batasan Cron Serverless (Vercel Hobby)
- **Endpoint Cron**: `GET /api/cron/pbg-reminder`
- **Jadwal Eksekusi**: Setiap hari pukul `02.00 UTC` (`09.00 WIB`), dikonfigurasi melalui `vercel.json` (`schedule: "0 2 * * *"`).
- **Batasan Paket Vercel Hobby**: Paket Hobby Vercel mengizinkan maksimal 1 kali eksekusi cron per hari. Jadwal `0 2 * * *` dirancang tepat satu kali setiap pagi pada jam kerja dinas.
- **Otorisasi**: Panggilan ke endpoint cron wajib menyertakan header `Authorization: Bearer <CRON_SECRET>`. Endpoint membandingkan token secara aman menggunakan algoritma `crypto.timingSafeEqual` dan langsung menolak (401 Unauthorized) jika token tidak cocok atau tidak disetel.

### 3. Pemicu Pengingat Manual (On-Demand)
Administrator dapat memicu pengiriman pengingat sewaktu-waktu:
- **Pengiriman Massal**: Tombol **Kirim Sekarang** di tab *Pengaturan Bot WA* (menampilkan konfirmasi jumlah tagihan belum bayar dalam rentang H-3).
- **Pengiriman Per Tagihan**: Tombol menu aksi **Kirim Pengingat WA** pada setiap baris tagihan berstatus `BELUM_BAYAR` di tabel PBG.

### 4. Kebijakan Privasi & Perlindungan Data Pribadi (UU PDP)
- Nomor WhatsApp pemohon merupakan data pribadi yang dilindungi oleh Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
- **Masking Terpadu**: Seluruh nomor kontak disensor di tingkat server (`maskWaNumber`, misal `62812****7890`) sebelum ditampilkan di antarmuka publik maupun dicatat pada tabel audit `notifikasi_log`.
- **Kerahasiaan Kredensial**: Token API Fonnte dan nomor seluler utuh tidak pernah dicatat dalam log konsol, basis data riwayat, atau pesan error.
- **Izin Kedinasan**: Pastikan pengiriman pesan WhatsApp dilakukan dengan izin instansi DPMPTSP Kabupaten Karawang untuk keperluan kedinasan penagihan retribusi daerah.

---

## 📌 Status Fitur Khusus
- **Region Deployment**: Vercel dikonfigurasikan pada region `sin1` (Singapura) sesuai berkas `vercel.json` untuk latensi terendah ke basis data Neon dan pengguna di Karawang.
