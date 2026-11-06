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

## 14. Implementasi Pengingat PBG Otomatis & Bot WhatsApp (Fase 4b)

Catatan penangguhan Fase 4 dicabut dan digantikan dengan implementasi penuh Fase 4b:

### A. Verifikasi Dokumentasi Resmi Fonnte API
Berdasarkan verifikasi terhadap dokumentasi resmi Fonnte (`https://api.fonnte.com/send`):
- **Endpoint**: `POST https://api.fonnte.com/send`
- **Header Otorisasi**: `Authorization: <FONNTE_TOKEN>` (token perangkat langsung, tanpa awalan `Bearer`).
- **Format Payload**: `multipart/form-data` dengan parameter:
  - `target`: Nomor telepon seluler pemohon dalam format internasional (`628...`).
  - `message`: Naskah teks pesan yang telah dirender dengan data dinamis.
  - `countryCode`: `'62'` (kode negara Republik Indonesia).
- **Format Respons**:
  - Berhasil: JSON `{ status: true, message: "message sent", detail: { id: [...], target: [...], status: ["sent"] } }`.
  - Gagal: JSON `{ status: false, reason: "device is disconnected" | "invalid token" }`.
- **Abstraksi `WaSender`**:
  - `FonnteWaSender`: Menggunakan `fetch` bawaan dengan `AbortSignal.timeout(10_000)` (10 detik timeout) tanpa pustaka eksternal.
  - `ConsoleWaSender`: Fallback mode *dry-run* bila token kosong atau toggle `wa_bot_aktif` bernilai `'false'`.
  - Pencegahan Kebocoran Data: Nomor tujuan selalu disensor (`62812****7890`) pada log konsol dan basis data, token otorisasi tidak pernah dicatat.

### B. Strategi Idempotensi & Pencegahan Kirim Ganda
- **Pencatatan Awal Atomik**:
  Sebelum mengirim permintaan HTTP ke gateway WhatsApp, sistem terlebih dahulu menyisipkan baris ke tabel `notifikasi_log` dengan status `'PENDING'`:
  `INSERT INTO notifikasi_log (pbg_id, jenis, jatuh_tempo_snapshot, status, ...) VALUES (...) ON CONFLICT (pbg_id, jenis, jatuh_tempo_snapshot) DO NOTHING RETURNING id;`
- **Jaminan Idempoten**:
  Bila terjadi eksekusi cron bersamaan atau pemicuan ulang pada hari yang sama, kueri `INSERT` menghasilkan 0 baris (`conflict`) dan sistem seketika melewati target tersebut (`dilewati++`). Gateway WhatsApp hanya dipanggil jika baris berhasil diklaim secara eksklusif.

### C. Desain Log Manual vs Otomatis
- **Pengingat Otomatis (Cron)**:
  Menggunakan `jenis = 'PBG_JATUH_TEMPO_H_MIN_3'` dan `jatuh_tempo_snapshot = pbg.jatuh_tempo`. Ini mengunci pengiriman tepat 1 kali per tagihan untuk siklus jatuh tempo tersebut.
- **Pengiriman Manual (On-Demand)**:
  Menggunakan `jenis = 'MANUAL'` dan `jatuh_tempo_snapshot = new Date()` (stempel waktu saat tombol diklik). Keputusan ini diambil agar:
  1. Pengiriman manual tidak bentrok dengan *unique constraint* pengingat otomatis.
  2. Pengiriman manual darurat tidak menghalangi cron otomatis harian yang akan datang.
  3. Riwayat setiap percobaan manual tercatat secara transparan dengan stempel waktu unik di tabel audit.

### D. Batas Pengiriman & Durasi Eksekusi
- **Batas Batch**: Dibatasi maksimal 50 target per eksekusi (`limit 50`) untuk menjaga durasi total di bawah batas *timeout* serverless Vercel (60 detik).
- **Jeda Antar Pesan**: Jeda 1.2 detik (`setTimeout`) disisipkan antar pengiriman pesan untuk menghindari pemblokiran nomor (anti-spam filter WhatsApp) oleh penyedia gateway.

### E. Hal yang Sengaja Belum Dikerjakan (Deferred)
- **Bot Dua Arah (Inbound Webhook)**: Modul saat ini berfokus pada pengiriman pengingat satu arah (*outbound notification*). Webhook penerima balasan pesan pemohon ditangguhkan ke fase berikutnya setelah regulasi alur penanganan aduan disepakati.
- **Pengingat Penugasan Harian Pegawai via WA**: Kerangka kerja `WaSender` yang dibangun telah siap pakai (*reusable*), namun pengingat jadwal tugas harian aparatur akan diaktifkan pada iterasi lanjutan.

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

---

## 19. Arsitektur Tema Gelap & Validasi Kontras Aksesibilitas WCAG AA (Fase A)
- **Tokenisasi Dua Lapisan (`:root` dan `.dark`)**:
  - Variabel CSS di `src/styles/globals.css` dipisahkan menjadi mode terang (`:root`) dan mode gelap (`.dark`).
  - Latar gelap menggunakan `#0A0A0B` (background kanvas), `#111113` (surface kartu/modal), `#18181B` (surface-2 untuk baris hover/input), `#27272A` (border halus), `#3F3F46` (border penegas), dan `#1E1E22` (muted).
  - Teks di mode gelap menggunakan `#FAFAFA` (text-primary), `#A1A1AA` (text-secondary), dan `#71717A` (text-neutral), menghindari putih murni `#FFFFFF` demi kenyamanan visual aparatur.
  - Elemen interaktif tetap mempertahankan indigo `#6366F1` sebagai aksen tunggal, dengan status hover dinaikkan satu langkah lebih terang (`#818CF8`) agar kontras optimal pada latar gelap.
- **Pencegahan Flash of Unstyled Theme (FOUT)**:
  - Mengintegrasikan paket `next-themes` dengan konfigurasi `attribute="class"`, `defaultTheme="system"`, `enableSystem`, dan `disableTransitionOnChange`. Script hidrasi inline `next-themes` menyuntikkan kelas `.dark` sebelum first paint dokumen, sehingga bebas dari kedipan warna (flash) saat memuat halaman.
  - Direktiva CSP `'unsafe-inline'` pada `script-src` mendukung eksekusi skrip hidrasi tema tanpa pelanggaran keamanan.
- **Hasil Uji Rasio Kontras Aksesibilitas (WCAG AA & AAA)**:
  Berdasarkan algoritma standar W3C Relative Luminance $L = 0.2126R + 0.7152G + 0.0722B$ dan rasio kontras $(L_1 + 0.05) / (L_2 + 0.05)$:

| Pasangan Token Semantik | Warna Teks (FG) | Warna Latar Tint (BG) | Rasio Kontras | Standar WCAG (Target AA >= 4.5:1) |
| :--- | :--- | :--- | :---: | :---: |
| **Success (Light)** | `#065F46` | `#ECFDF5` | **8.2 : 1** | **WCAG AAA** (Lulus) |
| **Success (Dark)** | `#6EE7B7` | `rgba(16, 185, 129, 0.15)` di atas `#111113` | **11.0 : 1** | **WCAG AAA** (Lulus) |
| **Warning (Light)** | `#92400E` | `#FFFBEB` | **7.5 : 1** | **WCAG AAA** (Lulus) |
| **Warning (Dark)** | `#FDE68A` | `rgba(245, 158, 11, 0.15)` di atas `#111113` | **12.2 : 1** | **WCAG AAA** (Lulus) |
| **Error (Light)** | `#991B1B` | `#FEF2F2` | **7.8 : 1** | **WCAG AAA** (Lulus) |
| **Error (Dark)** | `#FECACA` | `rgba(239, 68, 68, 0.15)` di atas `#111113` | **11.2 : 1** | **WCAG AAA** (Lulus) |
| **Neutral (Light)** | `#374151` | `#F3F4F6` | **8.5 : 1** | **WCAG AAA** (Lulus) |
| **Neutral (Dark)** | `#E4E4E7` | `rgba(161, 161, 170, 0.15)` di atas `#111113` | **12.6 : 1** | **WCAG AAA** (Lulus) |
| **Teks Utama (Dark)** | `#FAFAFA` | `#111113` (Surface) | **17.2 : 1** | **WCAG AAA** (Lulus) |
| **Teks Sekunder (Dark)**| `#A1A1AA` | `#111113` (Surface) | **7.4 : 1** | **WCAG AAA** (Lulus) |

- **Palet Visualisasi Data Zero-Indigo (`chart-1` s.d. `chart-4`)**:
  Untuk mematuhi aturan ketat `docs/DESIGN.md` bahwa indigo HANYA untuk elemen interaktif, data visualisasi chart menggunakan 4 token warna mandiri yang kontras dan jelas terbedakan:
  - `Chart 1` (Loket Pelayanan): `#10B981` (Light) / `#34D399` (Dark) — Emerald
  - `Chart 2` (Layanan Kecamatan): `#F59E0B` (Light) / `#FBBF24` (Dark) — Amber
  - `Chart 3` (Kantor Dinas): `#64748B` (Light) / `#94A3B8` (Dark) — Slate Netral
  - `Chart 4` (Lainnya / Lapangan): `#0284C7` (Light) / `#38BDF8` (Dark) — Sky Cyan
  Segmen "Kantor Dinas" dan "Lainnya / Lapangan" yang sebelumnya sama-sama bernuansa abu-abu kini terpisah dengan tegas (`Slate` vs `Sky`).
- **Elevasi & Shadow di Mode Gelap**:
  Bayangan difus (*shadow*) pada mode gelap direduksi drastis. Tingkat elevasi dinyatakan melalui kontras berlapis antara `surface` (`#111113`) ke `surface-2` (`#18181B`) serta penegasan `border` (`#27272A`), menjaga estetika Genesis tetap bersih tanpa noda bayangan (*muddy shadow*). Hover interaktif tetap bergerak `-2px` secara fisik.

---

## 11. Redesain Layout: Collapsible Sidebar & Top Bar Tipis (Fase B)
- **Komponen Layout Baru**:
  - `Sidebar.tsx`: Sidebar kiri desktop (`hidden md:flex flex-col`) dengan lebar 256px (`w-64`) dalam mode normal dan ~68px (`w-[68px]`) dalam mode ringkas (icon-only).
  - `TopHeader.tsx`: Bar atas tipis (`h-[52px]`) dengan `backdrop-blur`, sticky di atas, memuat burger toggle mobile, desktop collapse toggle, breadcrumb rute aktif, tombol pencarian cepat (⌘K), tombol `ThemeToggle`, dan `UserMenu`.
  - `MobileSidebarDrawer.tsx`: Drawer navigasi berbasis `Sheet` (slide dari kiri) untuk layar < 768px dengan touch target $\ge 40$px dan auto-close saat navigasi.
  - `QuickActionDropdown.tsx`: Dropdown tindakan cepat sesuai peran (`ADMIN`: Jadwal baru, Barang baru, Tagihan PBG baru, Pegawai baru; `PEGAWAI`: Kirim laporan, Ajukan tiket).
  - `SidebarNav.tsx`: Daftar navigasi bergrup (`ADMIN_NAV_GROUPS` dan `PEGAWAI_NAV_GROUPS` dari `src/config/navigation.ts`). Indikator aktif menggunakan tint tipis `bg-primary/10 text-primary-text` dan garis batas kiri 3px solid (`bg-primary`), tanpa balok warna solid.
  - `SidebarUserCard.tsx`: Bagian footer sidebar yang menampilkan avatar, nama, peran/bidang, serta menu profil, tema, dan logout.
- **Penyimpanan Status Collapse**:
  - Disimpan di `localStorage` dengan kunci `simop_sidebar_collapsed`.
  - Sinkronisasi state menggunakan `React.useSyncExternalStore` dengan server snapshot `false` untuk mencegah hydration mismatch dan cascading renders (`react-hooks/set-state-in-effect`).
- **Pembersihan Dead Code**:
  - Komponen lama `TopNav.tsx`, `NavLinks.tsx`, dan `MobileNavDrawer.tsx` telah dihapus sepenuhnya dari codebase.

---

## 12. Kartu Ringkasan, Visualisasi Data, & Penyelarasan Donut Chart (Fase C)
- **Kepatuhan Kontras Tombol Primer (`--color-primary`)**:
  - Nilai `--color-primary` disesuaikan menjadi `#5047E5` (Indigo 600 terkalibrasi) pada tema terang maupun gelap.
  - Teks tombol putih di atas `#5047E5` menghasilkan rasio kontras **6.22 : 1**, melampaui standar ketat **WCAG AA Normal Text ($\ge 4.5:1$)** tanpa menurunkan ambang batas kalkulasi.
  - Batas tombol primer terhadap surface gelap (`#111113`) menghasilkan rasio **3.03 : 1** (memenuhi batas graphical component $\ge 3.0:1$).
  - Ring fokus (`#5047E5` di terang, `#818CF8` di gelap) terverifikasi lulus rasio **6.22 : 1** dan **6.32 : 1** terhadap latar masing-masing.
- **Kepatuhan Kontras Tema Terang & Token Neutral / Placeholder**:
  - Nilai `--color-text-neutral` disesuaikan menjadi `#71717A` (Zinc 500) pada tema terang (`:root`), menghasilkan rasio kontras **4.83 : 1** terhadap surface putih (`#FFFFFF`) dan **4.63 : 1** terhadap background (`#FAFAFA`), secara penuh memenuhi standar WCAG AA Normal Text ($\ge 4.5:1$).
  - Pada tema gelap (`.dark`), `--color-text-neutral` disesuaikan menjadi `#8E8E93`, menghasilkan rasio kontras **5.78 : 1** terhadap surface `#111113` dan **6.07 : 1** terhadap background `#0A0A0B`.
  - Seluruh varian badge status pada tema terang (Sukses `#065F46`, Peringatan `#92400E`, Error `#991B1B`, Netral `#374151`) terverifikasi melampaui standar target AA/AAA ($\ge 6.84 : 1$ hingga $10.31 : 1$).
- **Definisi Jujur Donut Chart & Pegawai Bertugas**:
  - Segmen Donut Chart didefinisikan secara murni sebagai **Jumlah TUGAS** (`count(jadwal.id)`) per `lokasi_tipe`, dan nilai di tengah donut merepresentasikan akumulasi seluruh tugas hari ini dengan label `"Total Tugas"`.
  - Kartu StatCard "Bertugas Hari Ini" merepresentasikan **Jumlah PEGAWAI UNIK** (`countDistinct(jadwal.pegawaiId)`) lintas seluruh lokasi penugasan hari ini.
  - Penyelarasan ini menyelesaikan friksi visual matematis di mana penjumlahan segmen lokasi persis sama dengan total tugas di pusat donut, sementara kartu statistik menyajikan jumlah aparatur yang berdinas.
- **Hierarki Tipografi & Restriksi Ketat `font-mono`**:
  - `font-mono` HANYA diizinkan untuk identitas kode dan numerik sistem: Nomor SKRD, NIP Pegawai, Kode Barang, Nomor Tiket Layanan, dan tombol shortcut `<kbd>`.
  - Seluruh elemen non-kode (label grup sidebar, badge StatCard, label "Hari Ini", label "Total Tugas" di donut, subjudul logo dinas, badge tipe lokasi) distandardisasi menggunakan `font-sans` (`font-medium` / `font-semibold`).
  - Skala tipografi kartu distandardisasi: `title-card` 14-15px weight 600, `body` 14-15px, `meta`/`description` 12-13px `text-text-secondary`, `overline` 11px uppercase tracking-wide `font-sans`, `stat-number` besar font-display tabular-nums.
- **Format Modern Kartu Metrik (`StatCard.tsx`)**:
  - Format 3 tingkat: label kecil di kiri atas, badge konteks kecil di kanan atas (`Aparatur`, `Hari Ini`, `Perlu ACC`, `≤ 3 Hari`), angka besar font General Sans / `font-display` (2xl-3xl, tracking tight), dan deskripsi pendukung di bawah.
  - Ikon metrik disajikan berukuran ringkas (16-18px) di dalam wadah berlatar `bg-muted` dengan border tipis `border-border` dan teks sekunder `text-text-secondary`, tanpa warna primer.
  - Kartu "Tiket Menunggu" ditautkan ke `/admin/inventaris?tab=tiket` dan "PBG Jatuh Tempo" ditautkan ke `/admin/pbg`.
- **Kartu Panel Operasional (`AdminDashboardPanels.tsx`)**:
  - Menghadirkan dua kartu panel terfokus di samping Donut Chart:
    1. *Antrean Verifikasi Laporan*: Menampilkan hingga 5 laporan tugas dinas yang berstatus `MENUNGGU_VERIFIKASI` (judul tugas, nama pegawai, tanggal WIB, dan jenis lokasi) serta tombol "Lihat Semua ->" ke `/admin/verifikasi`.
    2. *Stok ATK Menipis*: Menampilkan daftar barang ATK/sarana dengan stok $\le$ batas minimum serta tombol "Lihat Semua ->" ke `/admin/inventaris`.


