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

## 12. Keamanan Presigned URL R2 & Penegakan Batas Ukuran 5 MB
- **Keterbatasan Presigned PUT**:
  Presigned URL PUT S3/Cloudflare R2 tidak dapat secara ketat memblokir ukuran payload yang diunggah klien secara langsung saat PUT berlangsung tanpa ketergantungan pada middleware eksternal.
- **Pemberian Solusi melalui `verifyR2Object`**:
  Celah tersebut ditutup secara ketat pada server saat pegawai mengonfirmasi penyelesaian tugas melalui Server Action `submitLaporanAction`. Server mengeksekusi `HeadObjectCommand` untuk memverifikasi `ContentLength <= 5 MB` dan `ContentType` yang valid. Bila berkas melanggar batas (misal ukuran melebihi 5 MB atau ekstensi/MIME palsu), server langsung menghapus objek dari R2 via `DeleteObjectCommand` dan menolak laporan tugas.

---

## 13. Kebijakan Barang Arsip, Tiket Tertunda, & Pemulihan
- **Aturan Hapus vs Arsip**:
  Barang tanpa riwayat tiket atau stok log dihapus permanen. Barang yang memiliki riwayat diarsipkan secara aman (`diarsipkan_pada = NOW()`).
- **Tiket Berstatus `MENUNGGU` pada Barang yang Diarsipkan**:
  Tiket tertunda yang sudah terlanjur diajukan sebelum barang diarsipkan tetap dipertahankan di sistem demi akuntabilitas. Admin dapat menolak tiket tersebut dengan catatan barang telah diarsipkan, atau memulihkan barang terlebih dahulu melalui `restoreBarangAction(id)` (`diarsipkan_pada = NULL`) sebelum menyetujui (ACC) permohonan.
- **Pencegahan Pembuatan Tiket Baru**:
  Fungsi query `getActiveBarangOptions` secara ketat memfilter `WHERE diarsipkan_pada IS NULL`, sehingga barang yang telah diarsipkan tidak dapat dipilih oleh pegawai pada formulir pengajuan tiket baru.

---

## 14. Penangguhan Fitur Cron Reminder & Bot WhatsApp (Fase 4)
Sesuai arahan, fitur otomatisasi WhatsApp pada Fase 4 **ditangguhkan sementara** demi fokus pada stabilitas data retribusi PBG dan verifikasi domain:
- **Komponen yang Ditangguhkan (TIDAK DIBUAT)**:
  1. Route Handler `/api/cron/pbg-reminder` dan jadwal cron `vercel.json`.
  2. Abstraksi `WaSender`, implementasi `FonnteWaSender`, `ConsoleWaSender`, `FONNTE_TOKEN`, dan `CRON_SECRET`.
  3. Panel UI pengaturan bot WhatsApp, editor template pesan, tombol "Kirim Sekarang", dan tabel log pengiriman notifikasi.
- **Pertahanan Skema**:
  Tabel `pengaturan` (dengan default `wa_bot_aktif = 'false'` dan template reminder) serta tabel `notifikasi_log` tetap dipertahankan pada skema basis data dan tidak diubah, sehingga siap diaktifkan kembali tanpa migrasi ulang.

---

## 15. Penanganan Transaksi Atomik Pemotongan Stok & Double-ACC Tiket
- **Klaim Tiket sebagai Langkah Pertama**:
  Dalam transaksi `accTiketAction`, pernyataan pertama yang dieksekusi adalah:
  `UPDATE tiket SET status = 'ACC', ... WHERE id = ? AND status = 'MENUNGGU' RETURNING *;`
- **Jaminan Konkurensi**:
  PostgreSQL secara otomatis memberikan row-level lock pada baris tiket tersebut. Apabila terjadi dua permintaan persetujuan secara bersamaan (misal dua admin mengklik ACC serentak via `Promise.all`), transaksi kedua akan mendapati 0 baris terpengaruh dan seketika dibatalkan (rollback). Hal ini menjamin stok barang hanya terpotong tepat satu kali dan mutasi stok ganda dicegah secara absolut tanpa distributed lock eksternal.


---

## 12. Modul Jadwal, Penyimpanan R2 Privat & Siklus Verifikasi Laporan (Fase 2 Update)
- **Bucket R2 Privat & Server-Generated Keys**:
  Bucket Cloudflare R2 dikonfigurasikan strictly private. Klien tidak pernah mengirim nama file kustom; Route Handler `/api/uploads/sign` menghasilkan key aman berformat `jadwal/{jadwalId}/{uuid}.{ext}`. Database hanya menyimpan `bukti_key` dan `pdf_key` (bukan URL permanen).
- **Pratinjau Terotorisasi Berumur Pendek (5 Menit)**:
  Pratinjau berkas privat dilayani melalui Route Handler `/api/uploads/preview?key=...` yang memverifikasi kepemilikan tugas atau role `ADMIN`, lalu menghasilkan signed GET URL berumur pendek (300 detik).
- **Pembersihan Berkas Otomatis Saat Revisi**:
  Jika laporan tugas pegawai sebelumnya ditolak (`TOLAK`) lalu pegawai mengunggah bukti perbaikan baru, Server Action `submitLaporanAction` secara otomatis memanggil `deleteR2Object()` untuk menghapus objek foto/PDF lama dari Cloudflare R2 guna mencegah penumpukan sampah berkas.
- **Generator Jadwal Rentang**:
  Fungsi domain `generateJadwalRange()` membatasi rentang maksimal 31 hari, menyediakan opsi `skipWeekends: true` (default) untuk melompati Sabtu & Minggu, menormalkan tanggal kalender murni YYYY-MM-DD dalam zona waktu WIB (+07:00), dan mendukung penugasan multi-pegawai secara atomik tanpa menyisipkan jam dinas buatan.
- **Siklus Hidup Status & Aturan Penolakan**:
  Transisi status divalidasi ketat melalui `validateStatusTransition()`:
  1. `BELUM_DIKERJAKAN` $\to$ `MENUNGGU_VERIFIKASI` (pegawai mengirim bukti foto wajib $\le$ 5 MB dan PDF opsional).
  2. `MENUNGGU_VERIFIKASI` $\to$ `SELESAI` (admin menyetujui / ACC).
  3. `MENUNGGU_VERIFIKASI` $\to$ `BELUM_DIKERJAKAN` (admin menolak; WAJIB menyertakan `catatanVerifikator` minimal 5 karakter sebagai petunjuk perbaikan bagi pegawai).
- **Kontrak Halaman & Reduksi Efek Samping**:
  Seluruh halaman modul (`/admin/pegawai`, `/admin/jadwal`, `/admin/verifikasi`, `/pegawai/jadwal`) merupakan Server Component tipis ($\le 45$ baris) dengan `loading.tsx` dan `error.tsx`. Dialog formulir dipisahkan menjadi komponen konten ber-key untuk mengeliminasi efek samping cascading `setState` dalam `useEffect`.

---

## 16. Format Nomor Tiket & Catatan Administratif (Fase 3 & 4 Update)
- **Format Nomor Tiket (`nomorTiket`)**:
  Setiap pengajuan tiket layanan inventaris/kerusakan digenerate secara otomatis pada tingkat server dengan format terstandar: `TKT-YYYYMMDD-XXXX` (di mana `YYYYMMDD` mencerminkan tanggal pengajuan dalam zona waktu WIB dan `XXXX` adalah 4 karakter alfanumerik acak unik dalam huruf kapital). Kolom ini diindeks dan bersifat unik untuk memudahkan penelusuran fisik dan komunikasi verbal antar-pegawai.
- **Kolom `catatan_admin` pada Tabel `tiket`**:
  Tabel `tiket` sejak migrasi awal `0000` telah dilengkapi kolom `catatan_admin` (`text`). Kolom ini dimutasi secara atomik pada Server Actions:
  1. Saat admin menyetujui tiket (`accTiketAction`): menyimpan petunjuk pengambilan barang atau instruksi pelaksanaan perbaikan teknis.
  2. Saat admin menolak tiket (`rejectTiketAction`): menyimpan alasan penolakan secara transparan yang dapat dibaca oleh pemohon di antarmuka riwayat tiket pegawai.
- **Dukungan Tiket Non-Katalog**:
  Untuk permohonan `PERMINTAAN_BARANG` tanpa `barang_id` (pengadaan ad-hoc atau barang khusus non-katalog), admin tetap dapat menyetujui tiket (status menjadi `ACC`) tanpa melakukan pemotongan stok pada tabel `barang` dan tanpa mencatat mutasi pada tabel `stok_log`.

---

## 17. Dashboard Terpadu, Profil Keamanan, & Pencarian Cepat Global (Fase 5 Update)
- **Arsitektur Dashboard Berbasis Peran (`src/modules/dashboard/`)**:
  - Halaman `src/app/(app)/dashboard/page.tsx` bertindak sebagai Server Component tipis ($\le 45$ baris) yang mengevaluasi role pengguna dan merender komponen visual yang sesuai secara terpisah:
    - **Dashboard Administrator**: Menyajikan 4 `StatCard` indikator utama, `DonutChart` distribusi penugasan hari ini yang dihitung murni di SQL dikelompokkan berdasarkan 4 `lokasi_tipe` sah (`KANTOR`, `LOKET`, `KECAMATAN`, `LAINNYA`) menggunakan tanggal kalender WIB dari `dates.ts`, serta 4 `AlertCard` berorientasi tindakan cepat (laporan menunggu verifikasi, tiket pending ACC, stok ATK menipis $\le \text{limit\_stok}$, tagihan PBG jatuh tempo $\le 3$ hari).
    - **Dashboard Pegawai**: Menyajikan ringkasan kalender mingguan berstandar WIB (Senin s.d. Minggu), visualisasi `ProgressRing` capaian penyelesaian tugas, shortcut tindakan cepat ("Kirim Laporan" dan "Ajukan Tiket"), serta daftar linimasa penugasan minggu ini lengkap dengan `StatusBadge` dan badge lokasi tipe baru.
- **Kueri Stok Menipis Dinamis di Tingkat SQL**:
  - Alih-alih batas statis 5 unit, deteksi barang menipis menggunakan pembandingan kolom SQL langsung: `barang.stok <= barang.limit_stok` dan `barang.diarsipkan_pada IS NULL`. Kolom `limit_stok` (integer not null default 5) ditambahkan ke tabel `barang` dengan dukungan input kustom per-barang pada form modal inventaris.
- **Manajemen Profil & Isolasi Sandi Mandiri (`/pegawai/profil`)**:
  - Informasi identitas aparatur disajikan dalam mode baca (read-only) untuk menjamin integritas data kepegawaian.
  - Aksi `changePasswordAction` secara ketat memverifikasi bahwa akun pemanggil berstatus aktif (`aktif === true`), memvalidasi panjang sandi ($\ge 8$), dan memicu `auth.api.changePassword` dengan parameter `revokeOtherSessions: true`. Sesi pada perangkat lain otomatis dibatalkan tanpa memberikan opsi memutasi sandi akun lain.
- **Pencarian Cepat Global Berperingkat (`CommandMenu` / Ctrl+K)**:
  - Mengintegrasikan dialog pencarian berbasis `cmdk` pada navigasi utama `TopNav` dengan listener keyboard `Cmd+K` / `Ctrl+K`.
  - Eksekusi pencarian dilakukan melalui Server Action `globalSearchAction` yang dibatasi maksimal 8 item hasil relevan dan menerapkan debounce 250ms.
  - Isolasi Hak Akses:
    - Role `ADMIN` dapat mencari lintas entitas (pegawai, inventaris barang, dan retribusi PBG).
    - Role `PEGAWAI` dibatasi secara ketat hanya dapat mencari jadwal tugas kedinasan miliknya sendiri (`WHERE pegawai_id = session.user.id`) serta katalog barang inventaris aktif untuk pengajuan tiket. Pegawai tidak pernah menerima hasil data aparatur lain, PBG, maupun jadwal rekan dinas lainnya.
- **Strategi Content-Security-Policy (CSP) & Script-Src**:
  - Dikonfigurasikan secara dinamis pada `next.config.ts`:
    - **Pemisahan Environment**: Directiva `script-src` diatur menjadi `'self' 'unsafe-inline'` pada mode produksi (`process.env.NODE_ENV === 'production'`), sedangkan `'unsafe-eval'` HANYA disertakan pada mode development lokal untuk kebutuhan React Fast Refresh / source map tooling. Di lingkungan produksi Vercel, `'unsafe-eval'` sepenuhnya dihapus.
    - **Pembenaran `'unsafe-inline'` di Produksi**: Pada Next.js 16 App Router (React 19), arsitektur *streaming Server Components (RSC)* memancarkan data hidrasi payload langsung ke dalam dokumen HTML melalui skrip inline (`self.__next_f.push(...)`). Pendekatan CSP dengan nonce dinamis per-permintaan pada infrastruktur serverless Vercel memerlukan Next.js middleware yang mematikan full Route Cache dan memicu overhead latensi TTFB. Dengan demikian, `'unsafe-inline'` untuk `script-src` dan `style-src` (diperlukan Tailwind dynamic style injection) dipertahankan, dan diimbangi dengan pertahanan mendalam (*defense-in-depth*): `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, sanitasi input ketat, dan `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
    - **Presisi Host R2 pada `connect-src` & `img-src`**: Menghilangkan wildcard satu level (`*.r2.cloudflarestorage.com`), digantikan dengan host presisi yang dibentuk langsung dari environment variable: `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` dan `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.

---

## 18. Migrasi Kanonikal Tanggal Jadwal & Integritas Agregasi (Fase 5 Penyesuaian)
- **Skema Kolom `tanggal date` Kanonikal (Migrasi 0004)**:
  - Tabel `jadwal` mengembalikan kolom tanggal ke spesifikasi awal: 1 baris per hari dengan kolom `tanggal date` (bukan rentang timestamp `tanggal_mulai`/`tanggal_selesai`).
  - Nilai tanggal dikirim dan disimpan murni berupa string `'YYYY-MM-DD'` berdasarkan kalender zona waktu WIB (`Asia/Jakarta`). Ini mengeliminasi risiko pergeseran hari kalender akibat konversi zona waktu UTC/WIB pada objek Date JavaScript.
  - Migrasi `drizzle/0004_canonical_jadwal_tanggal.sql` mempertahankan seluruh data penugasan lama dengan mengonversi timestamp awal secara aman: `(tanggal_mulai AT TIME ZONE 'Asia/Jakarta')::date`.
- **Penghitungan Pegawai Unik pada "Bertugas Hari Ini"**:
  - Metrik "Bertugas Hari Ini" pada dashboard administrator dan visualisasi `DonutChart` menghitung jumlah aparatur unik via `countDistinct(jadwal.pegawaiId)` yang difilter pada `eq(jadwal.tanggal, todayWib)`.
  - Jika seorang pegawai memiliki 2 atau lebih penugasan di lokasi yang sama atau berbeda pada hari yang sama, pegawai tersebut tepat dihitung sebagai 1 aparatur bertugas.
- **Isolasi Keamanan E2E & Production Immunity**:
  - Flag `PLAYWRIGHT === 'true'` dievaluasi secara defensif di `src/db/index.ts`: flag ini diabaikan sepenuhnya jika `process.env.VERCEL` aktif atau `NODE_ENV === 'production'`.
  - Endpoint dan origin testing lokal (`http://localhost:3001`, `http://localhost:3002`) otomatis dikecualikan dari `trustedOrigins` di lingkungan produksi.
  - Kebijakan rate limit (10 request/menit untuk login) dan secure cookies tetap aktif 100% di semua lingkungan tanpa relaksasi.
- **Status Skrip Migrasi Satu Kali (`sync-snapshot.mjs`)**:
  - Skrip `scripts/sync-snapshot.mjs` digunakan satu kali pada Fase 4 untuk sinkronisasi snapshot Drizzle Kit terhadap migrasi manual 0002. Skrip tersebut telah **dihapus secara permanen**. Migrasi skema berjalan dalam urutan kanonikal `0000`, `0001`, `0002`, dan `0003`, dengan verifikasi `pnpm db:generate` menghasilkan status `No schema changes, nothing to migrate 😴`.
