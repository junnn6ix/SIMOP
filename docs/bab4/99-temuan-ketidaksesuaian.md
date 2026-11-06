# 99 Temuan Ketidaksesuaian & Rekomendasi Laporan Kerja Praktik SIMOP DPMPTSP

Dokumen ini menggabungkan seluruh temuan ketidaksesuaian faktual antara kode sumber nyata (*ground truth*) di repositori SIMOP DPMPTSP dengan asumsi awal, draf laporan lama, maupun inkonsistensi internal antar-berkas skema basis data dan logika antarmuka. Temuan ini disusun sebagai pedoman koreksi bagi mahasiswa agar penulisan Laporan Kerja Praktik Bab 4 memiliki akurasi ilmiah yang mutlak tanpa ada rekayasa informasi (*anti-mengarang*).

---

## 1. Temuan TK-01: Perbedaan Framework Backend & ORM (Drizzle ORM vs Prisma, Next.js App Router vs Express)

- **Deskripsi Masalah**:
  Draf laporan awal dan template pengajuan sering mengasumsikan arsitektur backend tradisional berbasis Node.js Express dengan Prisma ORM (`schema.prisma`) dan pembuatan token JWT manual via pustaka `jsonwebtoken` atau `bcryptjs`.
- **Bukti di Kode Sumber**:
  - Berkas `package.json` baris 20–49 membuktikan dependensi nyata adalah: `next` (`^16.4.3`), `react` (`^19.0.0`), `drizzle-orm` (`^0.40.0`), `drizzle-kit` (`^0.30.5`), dan `better-auth` (`^1.2.9`).
  - Berkas `schema.prisma` dan framework Express.js **TIDAK DITEMUKAN DI KODE**. Seluruh definisi tabel basis data berada pada berkas TypeScript di `src/db/schema/auth.ts`, `src/db/schema/domain.ts`, dan `src/db/schema/enums.ts`.
  - Transaksi bisnis mutasi data tidak menggunakan REST controller Express, melainkan *Server Actions* Next.js (RPC) yang didefinisikan dengan direktiva `'use server'` pada berkas `src/modules/*/actions.ts`.
- **Dampak terhadap Laporan**:
  Mencantumkan cuplikan kode `schema.prisma`, route controller Express, atau fungsi hashing bcrypt manual akan menjadi kesalahan fatal yang membuktikan laporan tidak didasarkan pada aplikasi nyata.
- **Rekomendasi**:
  1. Ganti seluruh narasi arsitektur backend pada laporan menjadi *Next.js 16 App Router Server Actions* dengan *Drizzle ORM*.
  2. Ganti seluruh tabel skema basis data Prisma dengan notasi Drizzle ORM PostgreSQL (`pgTable`, `pgEnum`).

---

## 2. Temuan TK-02: Penangguhan Otomatisasi Bot WhatsApp dan Cron Job Pengingat PBG (Fase 4)

- **Deskripsi Masalah**:
  Terdapat klaim bahwa sistem memiliki bot pengirim pesan WhatsApp otomatis (Fonnte API Gateway) yang berjalan harian melalui penjadwal latar belakang (*cron job*) untuk mengingatkan pemohon retribusi PBG yang jatuh tempo pada H-3.
- **Bukti di Kode Sumber**:
  - Berkas `docs/DECISIONS.md` baris 121–128 secara eksplisit mencatat:
    > *"Sesuai arahan, fitur otomatisasi WhatsApp pada Fase 4 **ditangguhkan sementara** demi fokus pada stabilitas data retribusi PBG dan verifikasi domain: Komponen yang Ditangguhkan (TIDAK DIBUAT): 1. Route Handler `/api/cron/pbg-reminder` dan jadwal cron `vercel.json`. 2. Abstraksi `WaSender`, implementasi `FonnteWaSender`, `ConsoleWaSender`, `FONNTE_TOKEN`, dan `CRON_SECRET`."*
  - Berkas `vercel.json` baris 1–6 membuktikan **tidak ada konfigurasi cron scheduler**.
  - Berkas `.env.example` baris 39–44 memberikan catatan: `[CATATAN: Fitur bot WhatsApp dan Cron ditangguhkan sementara pada Fase 4]`.
  - Tabel `notifikasi_log` ([src/db/schema/domain.ts:132](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L132)) dan `pengaturan` ([src/db/schema/domain.ts:160](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/db/schema/domain.ts#L160)) memang ada di skema basis data, tetapi tidak memiliki kode pengiriman aktif (berstatus `[SKEMA SAJA / TIDAK TERHUBUNG]`).
- **Dampak terhadap Laporan**:
  Mengklaim fitur bot WhatsApp dan cron otomatisasi sebagai fitur berjalan pada Kebutuhan Fungsional merupakan bentuk fabrikasi data.
- **Rekomendasi**:
  1. Tandai fitur bot pengirim WhatsApp dan cron pengingat PBG sebagai `[DITANGGUHKAN SEMENTARA DI FASE 4]`.
  2. Pada Bab 4, jelaskan bahwa fitur deteksi tagihan PBG jatuh tempo $\le 3$ hari tetap berjalan penuh di tingkat kueri SQL (`getPbgDueSoon` dan filter antarmuka `/admin/pbg`), namun aksi penagihan atau komunikasi kontak dilakukan secara manual oleh administrator dinas.

---

## 3. Temuan TK-03: Nilai Enum `jadwal_status.DITOLAK` vs Siklus Hidup Transisi Penolakan Tugas

- **Deskripsi Masalah**:
  Tipe enumerasi basis data PostgreSQL `jadwal_status` memuat nilai `'DITOLAK'`. Namun, pada logika transisi status kode program, nilai ini tidak pernah digunakan.
- **Bukti di Kode Sumber**:
  - Pada `src/db/schema/enums.ts` baris 19–24:
    ```typescript
    export const jadwalStatusEnum = pgEnum('jadwal_status', [
      'BELUM_DIKERJAKAN',
      'MENUNGGU_VERIFIKASI',
      'SELESAI',
      'DITOLAK',
    ]);
    ```
  - Pada Server Action verifikasi laporan `src/modules/verifikasi/actions.ts` baris 63–78:
    ```typescript
    // TOLAK: Wajib ada catatan
    validateStatusTransition({
      currentStatus: target.status,
      targetStatus: 'BELUM_DIKERJAKAN',
      catatanVerifikator: parsed.catatanVerifikator,
    });

    await db.update(jadwal).set({
      status: 'BELUM_DIKERJAKAN',
      catatanVerifikator: parsed.catatanVerifikator, ...
    });
    ```
  - Pada pustaka transisi domain `src/modules/jadwal/lib/generator.ts` baris 121–126, penolakan secara eksplisit mengalihkan status dari `MENUNGGU_VERIFIKASI` kembali ke `BELUM_DIKERJAKAN`.
- **Dampak terhadap Laporan**:
  Bila *State Machine Diagram* atau narasi laporan menuliskan bahwa laporan yang ditolak beralih ke status `DITOLAK`, maka laporan bertentangan 100% dengan kode sumber.
- **Rekomendasi**:
  Jelaskan secara akademis bahwa nilai enum `DITOLAK` merupakan artefak skema lama/pasif. Dalam arsitektur saat ini, alur penolakan tugas dinas bersifat *konstruktif-revisif*, di mana laporan yang tidak memenuhi syarat dikembalikan ke status `BELUM_DIKERJAKAN` agar staf pegawai dapat memperbaiki dan mengunggah ulang bukti dinas sesuai catatan koreksi verifikator.

---

## 4. Temuan TK-04: Ketiadaan Fitur *Hard Delete* untuk Aparatur Pegawai

- **Deskripsi Masalah**:
  Draf lama sering mencantumkan operasi *CRUD Lengkap* (termasuk tombol/fungsi *Hapus Pegawai*).
- **Bukti di Kode Sumber**:
  - Pada berkas `src/modules/pegawai/actions.ts`, hanya terdapat 4 Server Actions: `createPegawaiAction`, `updatePegawaiAction`, `resetPegawaiPasswordAction`, dan `togglePegawaiStatusAction`.
  - Fungsi penghapusan baris fisik (`deletePegawaiAction` atau `DELETE FROM users`) **TIDAK DITEMUKAN DI KODE**.
  - Operasi penonaktifan akun dikelola melalui `deactivateUser` ([src/lib/user-management.ts:22-81](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/lib/user-management.ts#L22-L81)) yang memutasi `aktif = false`, `banned = true`, mencatat `banReason`, dan menghapus seluruh rekaman sesi aktif dari tabel `sessions`.
- **Dampak terhadap Laporan**:
  Mencantumkan *Use Case Hapus Pegawai* atau *FR Hapus Pegawai* merupakan ketidaksesuaian nyata.
- **Rekomendasi**:
  Ubah kebutuhan fungsional menjadi *Pengubahan Status Keaktifan Akun (Toggle Aktif/Nonaktif)* pada FR-05, dan berikan argumen logis bahwa peniadaan fitur *hard delete* bertujuan melindungi integritas relasi referensial terhadap riwayat penugasan jadwal dinas, pengajuan tiket, dan rekam audit mutasi stok.

---

## 5. Temuan TK-05: Standardisasi Tanggal Kalender Murni Kolom `jadwal.tanggal date` (Migrasi 0004)

- **Deskripsi Masalah**:
  Skema lama menggunakan rentang waktu `tanggal_mulai` dan `tanggal_selesai` bertipe `timestamp with time zone`, yang sering memicu inkonsistensi pergeseran hari akibat perbedaan zona waktu server UTC dengan waktu lokal WIB (+07:00).
- **Bukti di Kode Sumber**:
  - Berkas migrasi `drizzle/0004_canonical_jadwal_tanggal.sql` baris 1–6 menghapus kolom `tanggal_mulai` dan `tanggal_selesai`, lalu menetapkan kolom kanonikal `tanggal date NOT NULL`.
  - Berkas `docs/DECISIONS.md` baris 197–204 menjelaskan keputusan bahwa penugasan jadwal dihitung murni 1 baris per hari per aparatur dengan format string ISO kalender `'YYYY-MM-DD'` berstandar WIB.
- **Dampak terhadap Laporan**:
  Class Diagram dan Kamus Data yang masih mencantumkan `tanggal_mulai` dan `tanggal_selesai` tidak valid terhadap struktur basis data terkini.
- **Rekomendasi**:
  Gunakan kolom tunggal `tanggal: date` pada Tabel Kamus Data `jadwal` (Tabel 4.37) dan Class Diagram (Gambar 4.2).

---

## 6. Temuan TK-06: Perbedaan Definisi Segmen Donut Chart vs Kartu Statistik Dashboard Administrator

- **Deskripsi Masalah**:
  Pada Dashboard Administrator, terdapat potensi salah tafsir matematis antara angka di pusat *Donut Chart* dengan angka pada kartu ringkasan *Bertugas Hari Ini*.
- **Bukti di Kode Sumber**:
  - Pada `src/modules/dashboard/queries.ts` baris 70–78, Donut Chart menghitung **akumulasi tugas** (`count(jadwal.id)`) yang dikelompokkan berdasarkan 4 lokasi (`LOKET`, `KECAMATAN`, `KANTOR`, `LAINNYA`). Pusat Donut Chart menampilkan label `"Total Tugas"`.
  - Pada `src/modules/dashboard/queries.ts` baris 94–99, kartu StatCard "Bertugas Hari Ini" menghitung **jumlah aparatur pegawai unik** (`countDistinct(jadwal.pegawaiId)`).
- **Dampak terhadap Laporan**:
  Penguji laporan dapat mempertanyakan mengapa total tugas pada diagram donat (misal 6 tugas) berbeda dengan angka pegawai bertugas (misal 4 orang).
- **Rekomendasi**:
  Sajikan penjelasan eksplisit pada subbab visualisasi data bahwa seorang pegawai dinas dapat ditugaskan pada lebih dari satu kegiatan dalam hari yang sama (misalnya pagi bertugas di Loket dan siang bertugas verifikasi lapangan di Kecamatan). Dengan demikian, akumulasi tugas wajar lebih besar atau sama dengan jumlah aparatur unik yang bertugas.

---

## 7. Temuan TK-07: Evolusi Struktur Skema Retribusi PBG (Migrasi 0002)

- **Deskripsi Masalah**:
  Skema awal tabel `pbg` menggunakan nama kolom `nomor_pbg`, `nama_pemohon`, `alamat_proyek`, `nilai_retribusi`, dan `wa_pemohon` dengan enum `pbg_status` bernilai `BELUM_LUNAS`, `LUNAS`, dan `KADALUARSA`.
- **Bukti di Kode Sumber**:
  - Berkas migrasi `drizzle/0002_canonical_pbg_schema.sql` baris 1–36 merestrukturisasi skema menjadi kanonikal:
    - `nomor_pbg` $\to$ `no_skrd` (diindeks unik)
    - `nama_pemohon` $\to$ `pemohon`
    - `alamat_proyek` $\to$ `lokasi`
    - `nilai_retribusi` $\to$ `nominal numeric(14, 2)`
    - `wa_pemohon` $\to$ `no_wa`
    - Enum `pbg_status` disederhanakan menjadi hanya 2 nilai sah: `'BELUM_BAYAR'` dan `'LUNAS'`.
    - Ditambahkan kolom `dibayar_pada timestamp with time zone`.
- **Dampak terhadap Laporan**:
  Draf laporan yang masih menggunakan nama kolom lama atau enum `KADALUARSA` tidak sesuai dengan skema basis data PostgreSQL yang aktif saat ini.
- **Rekomendasi**:
  Perbarui kamus data tabel `pbg` (Tabel 4.41) sesuai dengan struktur kanonikal hasil migrasi 0002.

---

## 8. Temuan TK-08: Format Autentikasi Pengguna Sintetis (Surel Sintetis vs Surel Riil)

- **Deskripsi Masalah**:
  Draf laporan konvensional sering mengasumsikan pengguna masuk menggunakan alamat surel (*email*) eksternal dan kata sandi, lengkap dengan verifikasi kode OTP ke kotak masuk surel.
- **Bukti di Kode Sumber**:
  - Pada formulir masuk antarmuka `src/modules/auth/components/LoginForm.tsx` dan `src/lib/auth.ts` baris 101, sistem menggunakan plugin `username()` dari Better Auth.
  - Aparatur dinas tidak memiliki akun surel publik dalam sistem. Pada `src/lib/auth.ts` baris 160–163, sistem mendefinisikan fungsi `getSyntheticEmail`:
    ```typescript
    export function getSyntheticEmail(rawUsername: string): string {
      const sanitized = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      return `${sanitized}@simop.local`;
    }
    ```
  - Alamat surel berakhiran domain internal `@simop.local` dibuat secara sintetis oleh server semata-mata untuk memenuhi kebutuhan skema pangkalan data relasional Better Auth (`users.email` unik) tanpa melibatkan transmisi surel eksternal riil.
- **Dampak terhadap Laporan**:
  Menuliskan bahwa sistem memiliki fitur pendaftaran surel publik atau verifikasi OTP surel adalah kekeliruan yang bertentangan dengan arsitektur sistem tertutup internal dinas.
- **Rekomendasi**:
  Jelaskan bahwa autentikasi SIMOP berbasis nama pengguna (*username-based authentication*) tertutup dengan alamat surel sintetis internal demi menyederhanakan akses aparatur tanpa ketergantungan pada server surel pihak ketiga (*SMTP provider*).

---

## 9. Temuan TK-09: Pencegahan Konkurensi Persetujuan Tiket Ganda (*Atomic Claim Pattern*)

- **Deskripsi Masalah**:
  Draf perancangan sistem lama sering menggambarkan logika persetujuan permohonan barang secara sekuensial sederhana: (1) Periksa status tiket; (2) Jika menunggu, ubah status tiket menjadi disetujui; (3) Kurangi kuantitas stok barang di gudang.
- **Bukti di Kode Sumber**:
  - Pada kondisi lalu lintas tinggi dengan banyak administrator aktif, pola sekuensial di atas rawan memicu *race condition* (persetujuan tiket ganda atau *double ACC*) jika dua administrator mengklik tombol persetujuan pada detik yang sama.
  - Berkas `src/modules/tiket/actions.ts` baris 85–154 dan `docs/DECISIONS.md` baris 132–138 membuktikan bahwa sistem menerapkan pola *Atomic Claim First*:
    ```typescript
    const claimed = await tx
      .update(tiket)
      .set({ status: 'ACC', ... })
      .where(and(eq(tiket.id, tiketId), eq(tiket.status, 'MENUNGGU')))
      .returning({ ... });
    if (claimed.length === 0) throw new Error('Tiket tidak dapat disetujui...');
    ```
  - Klaim tiket langsung dieksekusi sebagai instruksi kueri pertama dengan memanfaatkan penguncian tingkat baris (*row-level exclusive lock*) PostgreSQL. Transaksi berikutnya yang berusaha menyetujui tiket yang sama secara instan mendapati 0 baris terpengaruh dan seketika dibatalkan (*rollback*).
- **Dampak terhadap Laporan**:
  Sequence diagram dan penjelasan alur pada draf lama yang tidak mencantumkan transaksi atomik klaim status dan pemotongan stok bersyarat mengabaikan mekanisme keamanan data paling penting pada modul inventaris.
- **Rekomendasi**:
  Cantumkan pola klaim atomik ini pada Sequence Diagram Gambar 4.5 dan narasi transaksi sisi server Subbab 4.6.3.7 sebagai keunggulan rekayasa perangkat lunak SIMOP.

---

## 10. Ringkasan Tindakan Penyelarasan

| Kode Temuan | Objek Temuan | Kondisi di Kode Nyata | Status Penyelarasan Bab 4 |
| :--- | :--- | :--- | :--- |
| **TK-01** | Backend & ORM | Next.js 16 Server Actions + Drizzle ORM | Diselaraskan penuh pada Bab 4 (00-inventaris.md & 01-analisis-sistem.md). |
| **TK-02** | Bot WA & Cron PBG | Ditangguhkan sementara pada Fase 4 | Ditandai transparan sebagai fitur yang ditangguhkan. |
| **TK-03** | Enum `jadwal_status` | Status `DITOLAK` pasif; transisi kembali ke `BELUM_DIKERJAKAN` | Dimodelkan akurat pada State Machine Diagram Gambar 4.7. |
| **TK-04** | Hapus Pegawai | Menerapkan *soft-deactivation* atomik (`togglePegawaiStatusAction`) | Dirumuskan sebagai FR-05 (Pengubahan Status Keaktifan Akun). |
| **TK-05** | Kolom Jadwal Tanggal | Menggunakan kolom tanggal kanonikal `tanggal date` (WIB) | Dimodelkan akurat pada Kamus Data Tabel 4.37. |
| **TK-06** | Metrik Dashboard | Donut Chart = Total Tugas; StatCard = Pegawai Unik | Diberikan penjelasan matematis pada analisis sistem. |
| **TK-07** | Skema Retribusi PBG | Kolom kanonikal: `no_skrd`, `nominal`, `dibayar_pada` | Dimodelkan akurat pada Kamus Data Tabel 4.41. |
| **TK-08** | Autentikasi Pengguna | Menggunakan nama pengguna dan surel sintetis `@simop.local` | Dijelaskan pada Subbab 4.6.1.3 & 4.6.3.1. |
| **TK-09** | Concurrency Tiket ACC | Transaksi atomik klaim status tiket dengan *row-level lock* | Dimodelkan pada Sequence Diagram Gambar 4.5 & Subbab 4.6.3.7. |


