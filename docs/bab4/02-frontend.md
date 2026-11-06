# 4.5 Implementasi Antarmuka Pengguna (*Front-End*)

Subbab ini menyajikan hasil analisis rekonstruksi (*reverse engineering*) terhadap implementasi antarmuka pengguna (*front-end*) Sistem Informasi Operasional dan Pelayanan (SIMOP) DPMPTSP Kabupaten Karawang. Seluruh pemaparan arsitektur, hierarki komponen, state reaktif, fungsi pengendali interaksi (*handlers*), serta integrasi Server Actions dan Route Handlers didasarkan secara mutlak pada kode sumber yang terpasang di repositori.

---

## 4.5.1 Arsitektur Antarmuka dan Perutean (*Routing Architecture*)

Antarmuka pengguna SIMOP DPMPTSP dibangun menggunakan kerangka kerja monolitik modern Next.js 16 (App Router) berbasis React 19 dan TypeScript [PERLU SITASI: arsitektur React Server Components]. Sistem menerapkan prinsip *separation of concerns* yang memisahkan kode menjadi lima lapisan terstruktur:
1. **Primitif UI Bebas Logika Domain (`src/components/ui/`)**: Komponen dasar berbasis Radix UI yang di-styling secara ketat sesuai sistem token desain Genesis (`docs/DESIGN.md`) seperti tombol (*button*), dialog modal (*dialog*), menu tarik-turun (*dropdown-menu*), input formulir (*input*), kotak centang (*checkbox*), sakelar (*switch*), dan tabulasi (*tabs*).
2. **Rangka Tata Letak Terpadu (`src/components/layout/`)**: Kerangka tata letak yang membungkus aplikasi, terdiri dari `AppShell.tsx`, `Sidebar.tsx` (bilah navigasi samping desktop yang dapat diperkecil/kolaps), `TopHeader.tsx` (bar atas tipis dengan breadcrumb rute, tombol tema, dan profil), `MobileSidebarDrawer.tsx` (laci navigasi samping untuk resolusi seluler < 768px), serta `QuickActionDropdown.tsx` (menu aksi cepat dinamis sesuai peran pengguna).
3. **Komponen Bersama Lintas Fitur (`src/components/shared/`)**: Komponen presentasi data yang menerima data via *props* dan tidak melakukan pengambilan data mandiri, seperti `DataTable.tsx` (tabel TanStack nir-gaya), `StatCard.tsx`, `DonutChart.tsx`, `ProgressRing.tsx`, `StatusBadge.tsx`, `FileDropzone.tsx`, `FilePreview.tsx`, dan `CommandMenu.tsx`.
4. **Komponen Modul Bisnis (`src/modules/<fitur>/components/`)**: Komponen tingkat modul yang merangkai komponen *shared* dan primitif *ui* untuk menjalankan alur bisnis spesifik serta memicu *Server Actions* untuk mutasi data.
5. **Halaman Server Component Tipis (`src/app/**/page.tsx`)**: Halaman tingkat rute yang dirancang sangat ringkas ($\le 60$ baris) yang bertugas mengeksekusi kueri data terotorisasi (`queries.ts`) di sisi server lalu meneruskan data (*data hydration*) ke komponen modul.

Pengelolaan tata letak aplikasi berpusat pada `src/app/(app)/layout.tsx` yang mengeksekusi guard autentikasi sesi terpusat (`requireAuth()`) dan membungkus `AppShell` tepat satu kali guna mencegah *layout thrashing* dan duplikasi rendering. Status penciutan bilah samping (*collapsible sidebar*) disimpan di `localStorage` dengan kunci `simop_sidebar_collapsed` dan disinkronisasikan menggunakan API `React.useSyncExternalStore` dengan server snapshot bernilai `false` untuk mencegah terjadinya ketidakcocokan hidrasi (*hydration mismatch*).

Berikut merupakan implementasi guard sesi terpusat dan pembungkusan tata letak utama aplikasi yang disajikan pada Cuplikan Kode 4.2.

```tsx
// src/app/(app)/layout.tsx:14-41
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session || !sessionData.user) {
    redirect('/login');
  }

  const [dbUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionData.user.id))
    .limit(1);

  if (!dbUser || !dbUser.aktif || dbUser.banned) {
    redirect('/login');
  }

  return (
    <AppShell
      user={{
        name: dbUser.name,
        username: dbUser.username || '',
        role: dbUser.role,
        bidang: dbUser.bidang,
      }}
    >
      {children}
    </AppShell>
  );
}
```

Cuplikan Kode 4.2 di atas mendemonstrasikan bahwa setiap rute di bawah kelompok `(app)` terlindungi secara mutlak di tingkat server. Jika sesi tidak ditemukan atau data akun pada tabel `users` berstatus `aktif === false` maupun `banned === true`, sistem seketika membelokkan navigasi (*server-side redirect*) ke `/login` sebelum komponen antarmuka anak sempat dievaluasi.

Sistem perutean (*routing*) SIMOP DPMPTSP memanfaatkan fitur *Route Groups* bawaan Next.js (`(auth)` dan `(app)`) untuk mengisolasi tata letak publik dan privat. Pemetaan rute antarmuka pengguna terhadap komponen pengendali dan pemenuhan kebutuhan fungsional disajikan secara komprehensif pada Tabel 4.45.

Berikut merupakan tabel pemetaan rute antarmuka pengguna, komponen pengendali, dan kebutuhan fungsional yang disajikan pada Tabel 4.45.

**Tabel 4.45** Pemetaan Rute Frontend, Komponen Pengendali, dan Kebutuhan Fungsional SIMOP DPMPTSP
| Jalur Rute Antarmuka (*URL Path*) | Berkas Halaman (*Page Component*) | Komponen Modul Utama | Batasan Akses Peran | Kebutuhan Fungsional yang Dipenuhi |
| :--- | :--- | :--- | :--- | :--- |
| `/` | [src/app/page.tsx:9-14](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/page.tsx#L9-L14) | Redirection Handler | Publik / Tamu | Pengalihan otomatis pengguna terautentikasi ke `/dashboard` atau tamu ke `/login` |
| `/login` | [src/app/(auth)/login/page.tsx:9-11](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(auth)/login/page.tsx#L9-L11) | `LoginForm.tsx` | Publik (Tamu) | FR-01 (Autentikasi Masuk Akun) |
| `/dashboard` | [src/app/(app)/dashboard/page.tsx:16-42](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/dashboard/page.tsx#L16-L42) | `AdminDashboard.tsx`, `PegawaiDashboard.tsx` | `ADMIN`, `PEGAWAI` | FR-20 (Visualisasi Kinerja Operasional pada Dashboard Terpadu) |
| `/admin/pegawai` | [src/app/(app)/admin/pegawai/page.tsx:16-31](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/pegawai/page.tsx#L16-L31) | `PegawaiTable.tsx`, `PegawaiFormDialog.tsx`, `ResetPasswordDialog.tsx` | `ADMIN` | FR-03, FR-04, FR-05, FR-06 (Manajemen Akun dan Kepegawaian) |
| `/admin/jadwal` | [src/app/(app)/admin/jadwal/page.tsx:16-35](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/jadwal/page.tsx#L16-L35) | `JadwalAdminTable.tsx`, `JadwalFormDialog.tsx`, `JadwalHeaderActions.tsx` | `ADMIN` | FR-07, FR-08 (Pengaturan Penugasan Jadwal Kedinasan) |
| `/admin/verifikasi` | [src/app/(app)/admin/verifikasi/page.tsx:15-30](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/verifikasi/page.tsx#L15-L30) | `VerifikasiQueue.tsx`, `VerifikasiCard.tsx`, `VerifikasiDialog.tsx` | `ADMIN` | FR-10 (Verifikasi Laporan Tugas Kedinasan) |
| `/admin/inventaris` | [src/app/(app)/admin/inventaris/page.tsx:16-40](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/inventaris/page.tsx#L16-L40) | `InventarisTabs.tsx`, `BarangTable.tsx`, `StokLogTable.tsx`, `TiketAdminTable.tsx` | `ADMIN` | FR-11, FR-12, FR-14, FR-15 (Pengelolaan Inventaris, Stok, dan Tiket) |
| `/admin/pbg` | [src/app/(app)/admin/pbg/page.tsx:16-33](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/pbg/page.tsx#L16-L33) | `PbgTable.tsx`, `PbgFormDialog.tsx`, `PbgHeaderActions.tsx` | `ADMIN` | FR-16, FR-17 (Pencatatan Retribusi PBG dan Monitoring SKRD) |
| `/pegawai/jadwal` | [src/app/(app)/pegawai/jadwal/page.tsx:15-30](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/jadwal/page.tsx#L15-L30) | `JadwalPegawaiTimeline.tsx`, `UploadLaporanDialog.tsx` | `PEGAWAI`, `ADMIN` | FR-09 (Pelaporan Bukti Pelaksanaan Tugas Lapangan) |
| `/pegawai/tiket` | [src/app/(app)/pegawai/tiket/page.tsx:17-37](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/tiket/page.tsx#L17-L37) | `TiketPegawaiList.tsx`, `TiketFormDialog.tsx` | `PEGAWAI`, `ADMIN` | FR-13 (Pengajuan Tiket Layanan Barang dan Kerusakan) |
| `/pegawai/profil` | [src/app/(app)/pegawai/profil/page.tsx:14-27](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/pegawai/profil/page.tsx#L14-L27) | `ProfilView.tsx` | `PEGAWAI`, `ADMIN` | FR-18 (Pembaruan Kata Sandi Mandiri Aparatur) |
| Global (Cmd+K) | [src/components/shared/CommandMenu.tsx:28-95](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/shared/CommandMenu.tsx#L28-L95) | `CommandMenu.tsx` | `ADMIN`, `PEGAWAI` | FR-19 (Pencarian Cepat Global Terisolasi Peran) |

Tabel 4.45 mengonfirmasi keteraturan perutean aplikasi, di mana rute-rute administratif di bawah `/admin/*` dilindungi lapis kedua melalui `src/app/(app)/admin/layout.tsx` yang mengevaluasi `if (dbUser?.role !== 'ADMIN') redirect('/dashboard')` ([src/app/(app)/admin/layout.tsx:24-26](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/app/(app)/admin/layout.tsx#L24-L26)).

---

## 4.5.2 Kelompok FR-01 & FR-02: Modul Autentikasi dan Terminasi Sesi

Kelompok kebutuhan ini menangani proses masuknya aparatur ke dalam sistem operasional serta penutupan sesi dinas secara aman.

### 1. Struktur Komponen dan State Reaktif
Modul autentikasi berpusat pada komponen klien `LoginForm.tsx` ([src/modules/auth/components/LoginForm.tsx:14-121](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/auth/components/LoginForm.tsx#L14-L121)) yang diletakkan pada halaman `/login`. Komponen ini mengelola empat variabel *state* internal:
- `username` (`string`): Menyimpan nilai masukan nama pengguna dari aparatur.
- `password` (`string`): Menyimpan nilai masukan kata sandi akun.
- `isLoading` (`boolean`): Indikator status proses pengiriman data ke server untuk menonaktifkan tombol dan input agar tidak terjadi pengiriman ganda.
- `errorMessage` (`string | null`): Menampung pesan kesalahan berbahasa Indonesia yang ditampilkan melalui komponen `InlineAlert`.

Terminasi sesi (FR-02) dikelola secara terpusat oleh fungsi `handleSignOut` pada `AppShell.tsx` ([src/components/layout/AppShell.tsx:70-81](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/layout/AppShell.tsx#L70-L81)) dan dipicu dari tombol "Keluar" pada bilah samping `SidebarUserCard.tsx` ([src/components/layout/SidebarUserCard.tsx:106-118](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/layout/SidebarUserCard.tsx#L106-L118)).

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Proses autentikasi memanfaatkan fungsi `signIn.username` dari Better Auth Client (`src/lib/auth-client.ts`). Penanganan kesalahan disesuaikan secara terperinci untuk mendeteksi pembatasan laju (HTTP 429) serta akun yang diblokir (`BANNED_USER`).

Berikut merupakan cuplikan kode asli fungsi penanganan form masuk sistem yang disajikan pada Cuplikan Kode 4.3.

```tsx
// src/modules/auth/components/LoginForm.tsx:21-59
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Silakan lengkapi nama pengguna dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.username({
        username: username.trim(),
        password,
      });

      if (res.error) {
        const errorText = res.error.message || '';
        const errorCode = res.error.code || '';

        if (errorCode === 'BANNED_USER' || errorText.includes('banned')) {
          setErrorMessage('Akun Anda dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.');
        } else if (res.error.status === 429) {
          setErrorMessage('Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat sebelum mencoba lagi.');
        } else {
          setErrorMessage('Nama pengguna atau kata sandi tidak cocok.');
        }
        return;
      }

      toast.success('Berhasil masuk ke SIMOP DPMPTSP.');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungi server. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };
```

Cuplikan Kode 4.3 di atas menunjukkan bahwa klien tidak melakukan *redirect* sebelum memastikan `res.error` bernilai kosong. Setelah sukses, pemanggilan `router.refresh()` mengeksekusi re-evaluasi sesi pada tata letak server, dan `router.push('/dashboard')` memindahkan rute aparatur secara mulus.

### 3. Struktur Antarmuka Pengguna
Tata letak antarmuka masuk diposisikan tepat di tengah kanvas menggunakan `AuthLayout.tsx` ([src/components/layout/AuthLayout.tsx:1-18](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/layout/AuthLayout.tsx#L1-L18)) dengan kartu bersudut membulat Genesis, logo monogram dinas huruf "S" berlatar indigo (`bg-primary`), judul kartu "SIMOP DPMPTSP", subjudul instansi, komponen masukan username, komponen `PasswordInput` dengan fitur toggle visibilitas mata (*eye icon*), dan tombol aksi "Masuk ke Sistem".

Berikut merupakan placeholder representasi antarmuka layar masuk sistem aparatur yang disajikan pada Gambar 4.10.

```text
+-----------------------------------------------------------------------+
|                            SIMOP DPMPTSP                              |
|   Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang   |
|-----------------------------------------------------------------------|
|  [ ! ] Nama pengguna atau kata sandi tidak cocok. (InlineAlert Error) |
|                                                                       |
|  Nama Pengguna (Username) *                                           |
|  [ admin.karawang                                                   ] |
|                                                                       |
|  Kata Sandi (Password) *                                              |
|  [ ****************                                             (O) ] |
|                                                                       |
|  [                         Masuk ke Sistem                          ] |
+-----------------------------------------------------------------------+
```
**Gambar 4.10** Layar Antarmuka Masuk Sistem Aparatur SIMOP DPMPTSP (`/login`)

Gambar 4.10 memperlihatkan struktur visual layar login yang ringkas, dengan fokus perhatian terarah langsung pada formulir kredensial dan indikator umpan balik kesalahan *inline*.

---

## 4.5.3 Kelompok FR-03 s.d. FR-06: Modul Manajemen Pegawai dan Akun Aparatur

Kelompok kebutuhan ini menangani administrasi data pegawai dinas, pendaftaran akun baru, penyuntingan data profil kedinasan, penonaktifan atomik akun, dan peresetan kata sandi staf oleh administrator.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada halaman `/admin/pegawai` dan dikelola oleh komponen:
- `PegawaiTable.tsx` ([src/modules/pegawai/components/PegawaiTable.tsx:41-278](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/components/PegawaiTable.tsx#L41-L278)): Mengelola tabel data pegawai menggunakan `@tanstack/react-table` dengan *state* penyaringan `search` (nama/username/NIP), `bidangFilter` (SEKRETARIAT, PTSP, PM, PENGAWASAN), state dialog edit `editData` & `isEditDialogOpen`, state reset sandi `resetUser` & `isResetDialogOpen`, serta state konfirmasi penonaktifan `toggleUser` & `isConfirmOpen`.
- `PegawaiFormDialog.tsx` ([src/modules/pegawai/components/PegawaiFormDialog.tsx:46-209](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/components/PegawaiFormDialog.tsx#L46-L209)): Modal dialog formulir input dengan state lokal `name`, `username`, `password`, `nip`, `bidang`, dan `isLoading`.
- `ResetPasswordDialog.tsx` ([src/modules/pegawai/components/ResetPasswordDialog.tsx:1-96](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pegawai/components/ResetPasswordDialog.tsx#L1-L96)): Dialog khusus peresetan kata sandi staf dengan state masukan `newPassword` (minimal 8 karakter).
- `ConfirmDialog.tsx` ([src/components/shared/ConfirmDialog.tsx:1-68](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/shared/ConfirmDialog.tsx#L1-L68)): Dialog penegasan tindakan berbahaya sebelum menonaktifkan akun aparatur.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Pengiriman data formulir dieksekusi secara reaktif melalui Server Actions `createPegawaiAction` untuk akun baru atau `updatePegawaiAction` untuk pembaharuan data lama.

Berikut merupakan cuplikan kode penanganan form pegawai yang disajikan pada Cuplikan Kode 4.4.

```tsx
// src/modules/pegawai/components/PegawaiFormDialog.tsx:57-86
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && initialData?.id) {
        await updatePegawaiAction({
          id: initialData.id,
          name: name.trim(),
          nip: nip.trim() || null,
          bidang,
        });
        toast.success('Data pegawai berhasil diperbarui.');
      } else {
        await createPegawaiAction({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          nip: nip.trim() || null,
          bidang,
        });
        toast.success(`Akun pegawai @${username.trim()} berhasil dibuat.`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses data pegawai.');
    } finally {
      setIsLoading(false);
    }
  };
```

Cuplikan Kode 4.4 menunjukkan pencabangan dinamis antara pembuatan akun baru dan penyuntingan profil aparatur. Pada pembuatan akun baru, nama pengguna secara otomatis dipaksa menjadi huruf kecil (`toLowerCase()`) sesuai aturan regex skema Zod `^[a-z0-9_.-]+$`.

### 3. Struktur Antarmuka Pengguna
Antarmuka menyajikan bilah alat atas (*toolbar*) berisi input pencarian cepat, dropdown pemfilteran bidang dinas, dan tombol primer "+ Tambah Pegawai". Tabel menyajikan kolom Nama & Username, NIP, Bidang Dinas, Peran (Badge ADMIN/PEGAWAI), Status (Badge Aktif hijau atau Nonaktif merah), serta menu aksi vertikal (*RowActions*) untuk edit data, reset sandi, dan nonaktifkan akun.

Berikut merupakan placeholder tampilan antarmuka manajemen pegawai yang disajikan pada Gambar 4.11.

```text
+--------------------------------------------------------------------------------------------------+
|  Manajemen Pegawai                                                      [ + Tambah Pegawai ]     |
|  Kelola akun, penugasan bidang dinas, dan status akses pegawai SIMOP DPMPTSP                     |
|--------------------------------------------------------------------------------------------------|
|  [ Cari nama / username / NIP... ]   [ Filter Bidang: Semua V ]                                  |
|--------------------------------------------------------------------------------------------------|
|  Nama & Pengguna         | NIP            | Bidang Dinas | Peran    | Status   | Aksi            |
|--------------------------------------------------------------------------------------------------|
|  Budi Santoso, S.Kom.    | 19880512201... | PTSP         | PEGAWAI  | [Aktif]  | [ Edit | ... V ]|
|  @pegawai_ptsp           |                |              |          |          |                 |
|  Siti Rahayu, S.E.       | 19920315201... | PM           | PEGAWAI  | [Aktif]  | [ Edit | ... V ]|
|  @pegawai_pm             |                |              |          |          |                 |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.11** Layar Pengelolaan dan Tabel Pegawai Dinas (`/admin/pegawai`)

Berikut merupakan placeholder dialog modal pendaftaran pegawai baru yang disajikan pada Gambar 4.12.

```text
+-----------------------------------------------------------------------+
|  Tambah Pegawai Baru                                              [X] |
|  Daftarkan akun aparatur baru untuk mengakses sistem SIMOP DPMPTSP.   |
|-----------------------------------------------------------------------|
|  Nama Lengkap *                                                       |
|  [ Budi Santoso, S.Kom.                                             ] |
|                                                                       |
|  Nama Pengguna (Username) *                                           |
|  [ budi.santoso                                                     ] |
|                                                                       |
|  Kata Sandi Awal *                                                    |
|  [ ****************                                             (O) ] |
|                                                                       |
|  Nomor Induk Pegawai (NIP)                                            |
|  [ 198805122010011002                                               ] |
|                                                                       |
|  Bidang Kedinasan *                                                   |
|  [ PTSP (Pelayanan Terpadu Satu Pintu)                              V]|
|-----------------------------------------------------------------------|
|                                        [ Batal ]  [ Simpan Pegawai ]  |
+-----------------------------------------------------------------------+
```
**Gambar 4.12** Modal Formulir Pendaftaran Aparatur Pegawai Baru

Gambar 4.11 dan Gambar 4.12 menunjukkan kelengkapan elemen administratif yang memungkinkan administrator mengelola hak akses aparatur secara terstruktur.

---

## 4.5.4 Kelompok FR-07 & FR-08: Modul Manajemen Jadwal dan Penugasan Dinas

Kelompok kebutuhan ini menangani penjadwalan tugas dinas aparatur oleh administrator menggunakan generator rentang tanggal multi-pegawai dan penghapusan jadwal tugas yang belum diverifikasi selesai.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/admin/jadwal` dan disusun oleh komponen:
- `JadwalAdminTable.tsx` ([src/modules/jadwal/components/JadwalAdminTable.tsx:1-260](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/components/JadwalAdminTable.tsx#L1-L260)): Menampilkan tabel daftar seluruh penugasan dengan filter pencarian, filter status tugas (`BELUM_DIKERJAKAN`, `MENUNGGU_VERIFIKASI`, `SELESAI`), filter tipe lokasi (`LOKET`, `KECAMATAN`, `KANTOR`, `LAINNYA`), dan tombol hapus penugasan berbasis `ConfirmDialog`.
- `JadwalFormDialog.tsx` ([src/modules/jadwal/components/JadwalFormDialog.tsx:42-306](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/components/JadwalFormDialog.tsx#L42-L306)): Menggunakan `useForm` dari React Hook Form dengan resolver Zod (`createJadwalRangeSchema`). State form mengontrol `judul`, `deskripsi`, `tanggalMulai`, `tanggalSelesai`, `pegawaiIds` (array string), `lokasiTipe`, `alamatLokasi`, dan sakelar `skipWeekends` (`boolean`, default `true`).
- `JadwalHeaderActions.tsx` ([src/modules/jadwal/components/JadwalHeaderActions.tsx:1-25](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/components/JadwalHeaderActions.tsx#L1-L25)): Tombol pembuka dialog pembuatan penugasan baru.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Pembuatan jadwal rentang tanggal mengeksekusi Server Action `createJadwalRangeAction`. Fungsi ini secara otomatis memvalidasi bahwa selisih hari tidak melebihi 31 hari dan mengeliminasi hari Sabtu dan Minggu jika opsi `skipWeekends` aktif.

Berikut merupakan cuplikan kode penanganan submit jadwal rentang tanggal yang disajikan pada Cuplikan Kode 4.5.

```tsx
// src/modules/jadwal/components/JadwalFormDialog.tsx:100-111
  const onSubmit = async (data: CreateJadwalRangeInput) => {
    setIsSubmitting(true);
    try {
      const res = await createJadwalRangeAction(data);
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat jadwal penugasan.');
    } finally {
      setIsSubmitting(false);
    }
  };
```

Cuplikan Kode 4.5 mengalirkan data masukan ke generator domain di server yang melakukan *batch insert* multi-baris secara atomik, sehingga puluhan baris penugasan pegawai langsung terbentuk dalam satu kali klik.

### 3. Struktur Antarmuka Pengguna
Antarmuka menyajikan tabel jadwal penugasan dengan kolom Tanggal Kalender (WIB), Judul Tugas, Pegawai Pelaksana, Tipe Lokasi (Badge hijau untuk Loket, amber untuk Kecamatan, slate untuk Kantor, sky untuk Lainnya), Status Tugas (`StatusBadge`), dan Tombol Hapus (merah). Dialog pembuatan tugas memuat daftar pilihan multi-pegawai dengan fitur *Select All*.

Berikut merupakan placeholder layar manajemen jadwal dinas yang disajikan pada Gambar 4.13.

```text
+--------------------------------------------------------------------------------------------------+
|  Jadwal & Penugasan Dinas                                                [ + Buat Jadwal Baru ]  |
|  Jadwalkan tugas piket internal, verifikasi lapangan, dan penugasan pegawai DPMPTSP              |
|--------------------------------------------------------------------------------------------------|
|  [ Cari tugas / pegawai... ]  [ Status: Semua V ]  [ Lokasi: Semua V ]  [ Pegawai: Semua V ]     |
|--------------------------------------------------------------------------------------------------|
|  Tanggal      | Judul Penugasan          | Pegawai Pelaksana  | Lokasi        | Status  | Aksi   |
|--------------------------------------------------------------------------------------------------|
|  04 Nov 2026  | Piket Pelayanan Loket 1  | Budi Santoso       | [LOKET]       | [BELUM] | [Hapus]|
|  04 Nov 2026  | Tinjau Lapangan PBG Kec. | Siti Rahayu        | [KECAMATAN]   | [SELESAI| [ - ]  |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.13** Layar Pengaturan Jadwal Dinas Administrator (`/admin/jadwal`)

Berikut merupakan placeholder dialog generator penugasan rentang tanggal yang disajikan pada Gambar 4.14.

```text
+-----------------------------------------------------------------------+
|  Buat Penugasan Jadwal Kedinasan                                  [X] |
|  Buat penugasan rentang tanggal untuk satu atau banyak staf dinas.    |
|-----------------------------------------------------------------------|
|  Judul Penugasan *                                                    |
|  [ Piket Pelayanan Front Office Loket Perizinan                     ] |
|                                                                       |
|  Tanggal Mulai *                     Tanggal Selesai *                |
|  [ 2026-11-04               (Cal) ]  [ 2026-11-10             (Cal) ] |
|                                                                       |
|  [X] Lewati Akhir Pekan (Sabtu & Minggu tidak dibuatkan penugasan)    |
|                                                                       |
|  Pilih Aparatur Pegawai (Minimal 1) *       [ Pilih Semua Pegawai ]   |
|  [X] Budi Santoso, S.Kom. (Bidang PTSP)                               |
|  [X] Siti Rahayu, S.E. (Bidang PM)                                    |
|                                                                       |
|  Tipe Lokasi Penugasan *                                              |
|  [ LOKET (Loket Pelayanan DPMPTSP)                                  V]|
|-----------------------------------------------------------------------|
|                                        [ Batal ]  [ Terbitkan Jadwal] |
+-----------------------------------------------------------------------+
```
**Gambar 4.14** Modal Dialog Generator Penugasan Rentang Tanggal

Gambar 4.13 dan Gambar 4.14 menunjukkan fleksibilitas formulir penugasan yang secara otomatis mengeliminasi hari libur dinas sesuai konfigurasi `skipWeekends`.

---

## 4.5.5 Kelompok FR-09: Modul Pelaporan Bukti Pelaksanaan Tugas oleh Pegawai

Kelompok kebutuhan ini menangani pengunggahan berkas bukti foto fisik kegiatan lapangan dan dokumen PDF pendukung ke Cloudflare R2, serta penyerahan laporan tugas oleh pegawai pelaksana.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/pegawai/jadwal` dan dikelola oleh:
- `JadwalPegawaiTimeline.tsx` ([src/modules/jadwal/components/JadwalPegawaiTimeline.tsx:1-240](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/components/JadwalPegawaiTimeline.tsx#L1-L240)): Menyajikan kartu linimasa tugas mandiri aparatur yang dikelompokkan per tanggal. Memuat tombol "Kirim Laporan" pada tugas berstatus `BELUM_DIKERJAKAN` serta menampilkan kotak catatan revisi verifikator berwarna kuning jika laporan sebelumnya ditolak.
- `UploadLaporanDialog.tsx` ([src/modules/jadwal/components/UploadLaporanDialog.tsx:32-220](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/jadwal/components/UploadLaporanDialog.tsx#L32-L220)): Dialog modal pengunggahan berkas bukti dengan state reaktif `fotoFile` (`File | null`), `pdfFile` (`File | null`), `isSubmitting` (`boolean`), dan `errorMessage` (`string | null`).
- `FileDropzone.tsx` ([src/components/shared/FileDropzone.tsx:1-120](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/shared/FileDropzone.tsx#L1-L120)): Komponen dropzone penarik berkas (*drag and drop*) dengan validasi batas ukuran klien $\le 5$ MB dan filter tipe MIME (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Alur pengunggahan berkas tidak mengirimkan payload biner langsung ke Next.js server, melainkan menggunakan pola arsitektur *direct-to-cloud upload* menggunakan Presigned URL S3/Cloudflare R2 berumur 300 detik.

Berikut merupakan cuplikan kode penanganan pengunggahan berkas bukti ke Cloudflare R2 yang disajikan pada Cuplikan Kode 4.6.

```tsx
// src/modules/jadwal/components/UploadLaporanDialog.tsx:50-82
      // 1. Minta presigned URL untuk foto bukti
      const fotoSignRes = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jadwalId: jadwal.id,
          slot: 'foto',
          contentType: fotoFile.type,
          fileSize: fotoFile.size,
        }),
      });

      if (!fotoSignRes.ok) {
        const errJson = await fotoSignRes.json();
        throw new Error(errJson.error || 'Gagal menyiapkan unggahan foto.');
      }

      const { presignedUrl: fotoPresignedUrl, objectKey: fotoKey } =
        await fotoSignRes.json();

      // 2. Upload foto langsung ke Cloudflare R2
      const fotoUploadRes = await fetch(fotoPresignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fotoFile.type,
        },
        body: fotoFile,
      });

      if (!fotoUploadRes.ok) {
        throw new Error('Gagal mengunggah berkas foto ke Cloudflare R2.');
      }
```

Cuplikan Kode 4.6 di atas membuktikan bahwa peramban pegawai mengunggah biner berkas langsung ke infrastruktur Cloudflare R2 via HTTP PUT presigned URL. Setelah unggahan biner sukses, klien memanggil Server Action `submitLaporanAction({ jadwalId: jadwal.id, buktiKey: fotoKey, pdfKey })` untuk memvalidasi integritas objek dan mengubah status penugasan.

### 3. Struktur Antarmuka Pengguna
Antarmuka menyajikan kartu-kartu penugasan linimasa yang dilengkapi tanggal dinas, badge lokasi, indikator status, tombol pratinjau bukti jika sudah diunggah, serta tombol tindakan "Kirim Laporan Tugas".

Berikut merupakan placeholder tampilan linimasa jadwal tugas pegawai yang disajikan pada Gambar 4.15.

```text
+--------------------------------------------------------------------------------------------------+
|  Jadwal Penugasan Saya                                                                           |
|  Pantau penugasan dinas Anda, laporkan bukti kegiatan lapangan, dan pantau status verifikasi.     |
|--------------------------------------------------------------------------------------------------|
|  [ Filter Status: Semua V ]                                                                      |
|--------------------------------------------------------------------------------------------------|
|  +-- 04 November 2026 (Hari Ini) -------------------------------------------------------------+  |
|  | [LOKET] Piket Pelayanan Front Office PTSP                             [ BELUM DIKERJAKAN ] |  |
|  | Lokasi: Loket 1 Lantai 1 DPMPTSP Karawang                                                  |  |
|  | Arahan: Layani pendaftaran izin operasional dan verifikasi berkas pemohon.                  |  |
|  |                                                                 [ Kirim Laporan Tugas ]    |  |
|  +--------------------------------------------------------------------------------------------+  |
|  +-- 03 November 2026 ------------------------------------------------------------------------+  |
|  | [KECAMATAN] Verifikasi Lapangan Lokasi PBG Telukjambe                 [ SELESAI ]          |  |
|  | [Lihat Foto Bukti]  [Unduh Dokumen PDF]                               (Diverifikasi Admin) |  |
|  +--------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.15** Layar Linimasa Jadwal Tugas Mandiri Pegawai (`/pegawai/jadwal`)

Berikut merupakan placeholder dialog pengunggahan bukti laporan tugas dinas yang disajikan pada Gambar 4.16.

```text
+-----------------------------------------------------------------------+
|  Kirim Laporan Pelaksanaan Tugas                                  [X] |
|  Unggah foto dokumentasi kegiatan fisik di lokasi dinas.              |
|-----------------------------------------------------------------------|
|  Tugas: Piket Pelayanan Front Office PTSP (04 Nov 2026)               |
|                                                                       |
|  Foto Bukti Pelaksanaan (Wajib, Maks 5 MB) *                          |
|  +-----------------------------------------------------------------+  |
|  | [ Ikon Gambar ]                                                  |  |
|  | Tarik & lepaskan foto kegiatan di sini, atau Klik untuk Memilih  |  |
|  | Format yang diizinkan: JPEG, PNG, WebP (Maksimal 5 MB)          |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  Dokumen PDF Pendukung (Opsional, Maks 5 MB)                          |
|  +-----------------------------------------------------------------+  |
|  | Tarik & lepaskan berkas berita acara/surat tugas PDF di sini    |  |
|  +-----------------------------------------------------------------+  |
|-----------------------------------------------------------------------|
|                                        [ Batal ]  [ Kirimkan Laporan] |
+-----------------------------------------------------------------------+
```
**Gambar 4.16** Modal Dialog Pengunggahan Bukti Tugas Dinas

Gambar 4.15 dan Gambar 4.16 mendeskripsikan interaksi pegawai yang terpandu dengan jelas dalam mendokumentasikan kegiatan operasional dinas.

---

## 4.5.6 Kelompok FR-10: Modul Antrean dan Verifikasi Laporan Kedinasan

Kelompok kebutuhan ini menangani peninjauan berkas bukti tugas dinas oleh administrator/verifikator dinas dan penetapan keputusan persetujuan (ACC) atau penolakan laporan dengan catatan koreksi.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/admin/verifikasi` dan disusun oleh:
- `VerifikasiQueue.tsx` ([src/modules/verifikasi/components/VerifikasiQueue.tsx:1-85](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/verifikasi/components/VerifikasiQueue.tsx#L1-L85)): Menampilkan kisi antrean kartu laporan berstatus `MENUNGGU_VERIFIKASI` dengan state lokal daftar antrean `items` dan state kartu terpilih `selectedItem` untuk membuka dialog verifikasi.
- `VerifikasiCard.tsx` ([src/modules/verifikasi/components/VerifikasiCard.tsx:1-95](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/verifikasi/components/VerifikasiCard.tsx#L1-L95)): Kartu ringkasan penugasan yang menyajikan judul tugas, nama pegawai pelaksana, bidang dinas, tipe lokasi, tanggal WIB, dan tombol "Periksa Laporan".
- `VerifikasiDialog.tsx` ([src/modules/verifikasi/components/VerifikasiDialog.tsx:44-316](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/verifikasi/components/VerifikasiDialog.tsx#L44-L316)): Dialog modal peninjauan berkas dengan state teks catatan penolakan `catatan` (`string`), state proses `isSubmitting` (`boolean`), state tipe aksi `actionType` (`'ACC' | 'TOLAK' | null`), serta state URL pratinjau media `fotoUrl` dan `pdfUrl`.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Saat modal terbuka, komponen secara otomatis memicu pemanggilan HTTP GET ke `/api/uploads/preview?key=...` untuk memperoleh signed GET URL Cloudflare R2 berumur 300 detik. Pengambilan keputusan diverifikasi melalui Server Action `verifikasiJadwalAction`.

Berikut merupakan cuplikan kode fungsi penanganan keputusan verifikasi yang disajikan pada Cuplikan Kode 4.7.

```tsx
// src/modules/verifikasi/components/VerifikasiDialog.tsx:90-120
  const handleDecision = async (decision: 'ACC' | 'TOLAK') => {
    if (decision === 'TOLAK' && (!catatan.trim() || catatan.trim().length < 5)) {
      toast.error('Tuliskan alasan penolakan (minimal 5 karakter) untuk pegawai.');
      return;
    }

    setIsSubmitting(true);
    setActionType(decision);

    try {
      const res = await verifikasiJadwalAction({
        jadwalId: item.id,
        decision,
        catatanVerifikator: decision === 'TOLAK' ? catatan.trim() : null,
      });

      toast.success(res.message);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi laporan.');
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };
```

Cuplikan Kode 4.7 menunjukkan validasi sisi klien yang melarang keputusan TOLAK jika catatan verifikator kurang dari 5 karakter, selaras dengan validasi skema Zod `superRefine` di sisi server.

### 3. Struktur Antarmuka Pengguna
Antarmuka menyajikan kisi kartu antrean tugas. Ketika modal peninjauan dibuka, sisi kiri dialog menampilkan foto dokumentasi kegiatan lapangan dan tautan dokumen PDF, sedangkan sisi kanan menyajikan identitas tugas, nama aparatur, textarea catatan penolakan, serta dua tombol aksi berdampingan: tombol merah "Tolak Laporan" dan tombol hijau "Setujui Laporan (ACC)".

Berikut merupakan placeholder layar antrean verifikasi laporan tugas yang disajikan pada Gambar 4.17.

```text
+--------------------------------------------------------------------------------------------------+
|  Antrean Verifikasi Laporan                                              [ 3 Menunggu Verifikasi]|
|  Periksa dan setujui (ACC) bukti foto lapangan serta dokumen pendukung dari laporan tugas dinas.  |
|--------------------------------------------------------------------------------------------------|
|  +----------------------------------+  +----------------------------------+                      |
|  | Piket Pelayanan Loket Perizinan  |  | Pengawasan Lapangan Tambun       |                      |
|  | Pegawai: Budi Santoso, S.Kom.    |  | Pegawai: Siti Rahayu, S.E.       |                      |
|  | Tanggal: 04 Nov 2026 | [LOKET]   |  | Tanggal: 04 Nov 2026 | [LAPANGAN]|                      |
|  | Bukti: Foto terlampir (1.8 MB)   |  | Bukti: Foto & PDF terlampir      |                      |
|  |                                  |  |                                  |                      |
|  |            [ Periksa Laporan ]   |  |            [ Periksa Laporan ]   |                      |
|  +----------------------------------+  +----------------------------------+                      |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.17** Layar Antrean Verifikasi Laporan Tugas (`/admin/verifikasi`)

Berikut merupakan placeholder modal dialog peninjauan bukti verifikasi yang disajikan pada Gambar 4.18.

```text
+-----------------------------------------------------------------------------------------------+
|  Verifikasi Laporan Tugas Kedinasan                                                       [X] |
|-----------------------------------------------------------------------------------------------|
|  [ Panel Kiri: Pratinjau Foto ]               |  [ Panel Kanan: Rincian & Keputusan ]         |
|  +-----------------------------------------+  |  Tugas: Piket Pelayanan Loket Perizinan       |
|  |                                         |  |  Pelaksana: Budi Santoso, S.Kom. (@pegawai)   |
|  |                                         |  |  Tanggal: 04 November 2026                    |
|  |      [ Foto Dokumentasi Lapangan ]      |  |  Lokasi: Loket Pelayanan Front Office         |
|  |                                         |  |-----------------------------------------------|
|  |                                         |  |  Catatan Verifikator (Wajib jika menolak):    |
|  +-----------------------------------------+  |  [ Foto kurang jelas, mohon lampirkan foto  ] |
|  [ Unduh Dokumen Pendukung PDF (340 KB) ]     |  [ logbook pelayanan harian loket.          ] |
|-----------------------------------------------------------------------------------------------|
|                                        [ Batal ]  [ Tolak Laporan (Merah) ]  [ Setujui ACC ]  |
+-----------------------------------------------------------------------------------------------+
```
**Gambar 4.18** Dialog Modal Peninjauan Bukti dan Keputusan Verifikator

Gambar 4.17 dan Gambar 4.18 mendeskripsikan kenyamanan kerja verifikator dalam meneliti validitas bukti fisik sebelum mengesahkan capaian kerja staf.

---

## 4.5.7 Kelompok FR-11 & FR-12: Modul Pengelolaan Inventaris Barang dan Mutasi Stok

Kelompok kebutuhan ini menangani pengelolaan item katalog barang perlengkapan dinas (ATK dan aset), pemutakhiran data barang, penyesuaian kuantitas stok fisik, pengarsipan aman, pemulihan barang arsip, dan audit buku besar persediaan.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/admin/inventaris` dan disusun oleh komponen:
- `InventarisTabs.tsx` ([src/modules/inventaris/components/InventarisTabs.tsx:1-85](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/components/InventarisTabs.tsx#L1-L85)): Menyajikan navigasi tiga tabulasi terpadu: "Katalog Barang", "Riwayat Mutasi Stok", dan "Tiket Layanan". Mengatur URL search params `?tab=...` untuk navigasi langsung.
- `BarangTable.tsx` ([src/modules/inventaris/components/BarangTable.tsx:1-270](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/components/BarangTable.tsx#L1-L270)): Tabel katalog barang dengan filter pencarian, filter kategori (ATK/ASET), tombol tindakan penyesuaian stok, tombol edit, tombol arsip/hapus, dan tombol pemulihan arsip.
- `BarangFormDialog.tsx` ([src/modules/inventaris/components/BarangFormDialog.tsx:49-244](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/components/BarangFormDialog.tsx#L49-L244)): Dialog pendaftaran dan penyuntingan barang dengan state `nama`, `kodeBarang`, `kategori`, `stok`, `limitStok`, `satuan`, dan `deskripsi`.
- `AdjustStokDialog.tsx` ([src/modules/inventaris/components/AdjustStokDialog.tsx:45-198](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/components/AdjustStokDialog.tsx#L45-L198)): Dialog penyesuaian kuantitas stok dengan state `tipe` (`'MASUK' | 'KELUAR'`), `jumlah` (`number`), dan `keterangan` (`string`).
- `StokLogTable.tsx` ([src/modules/inventaris/components/StokLogTable.tsx:1-135](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/inventaris/components/StokLogTable.tsx#L1-L135)): Tabel buku besar kronologis seluruh mutasi persediaan dinas.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Penyesuaian kuantitas stok fisik memicu Server Action `adjustStokAction` yang dieksekusi dalam transaksi PostgreSQL atomik.

Berikut merupakan cuplikan kode penanganan penyesuaian stok barang yang disajikan pada Cuplikan Kode 4.8.

```tsx
// src/modules/inventaris/components/AdjustStokDialog.tsx:51-78
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jumlah <= 0) {
      toast.error('Jumlah mutasi stok minimal 1.');
      return;
    }

    if (tipe === 'KELUAR' && jumlah > target.stok) {
      toast.error(`Stok saat ini (${target.stok}) tidak cukup untuk pengurangan ${jumlah}.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await adjustStokAction({
        barangId: target.id,
        tipe,
        jumlah,
        keterangan: keterangan.trim(),
      });
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyesuaikan stok barang.');
    } finally {
      setIsLoading(false);
    }
  };
```

Cuplikan Kode 4.8 memperlihatkan validasi ganda di sisi klien untuk mencegah pengguna menginput kuantitas mutasi KELUAR yang melampaui sisa persediaan fisik sebelum permintaan dikirimkan ke server.

### 3. Struktur Antarmuka Pengguna
Antarmuka menyajikan tab navigasi, bilah pencarian, kartu ringkasan stok, dan tabel barang yang dilengkapi indikator badge kategori, badge peringatan kuning jika stok $\le$ limit stok, serta tombol aksi vertikal.

Berikut merupakan placeholder tampilan katalog inventaris barang yang disajikan pada Gambar 4.19.

```text
+--------------------------------------------------------------------------------------------------+
|  Inventaris & Tiket Layanan                                              [ + Tambah Barang Baru ]|
|  Kelola katalog barang ATK/aset dinas, pantau mutasi persediaan, dan proses tiket permohonan.    |
|--------------------------------------------------------------------------------------------------|
|  [ (•) Katalog Barang ]   [ Riwayat Mutasi Stok ]   [ Tiket Permohonan Layanan ]                 |
|--------------------------------------------------------------------------------------------------|
|  [ Cari nama / kode barang... ]   [ Kategori: Semua V ]   [ [X] Tampilkan Barang Diarsipkan ]    |
|--------------------------------------------------------------------------------------------------|
|  Kode Barang   | Nama Barang                 | Kategori | Sisa Stok | Batas Min | Aksi           |
|--------------------------------------------------------------------------------------------------|
|  BRG-ATK-001   | Kertas HVS A4 80gsm         | [ATK]    | 50 Rim    | 5 Rim     | [Stok|Edit|...] |
|  BRG-ATK-002   | Tinta Printer Epson 003     | [ATK]    | 2 Botol ! | 5 Botol   | [Stok|Edit|...] |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.19** Layar Katalog Inventaris Barang dan Tabulasi Persediaan (`/admin/inventaris`)

Berikut merupakan placeholder dialog penyesuaian kuantitas stok fisik yang disajikan pada Gambar 4.20.

```text
+-----------------------------------------------------------------------+
|  Penyesuaian Kuantitas Stok Fisik                                 [X] |
|-----------------------------------------------------------------------|
|  Barang: Kertas HVS A4 80gsm (Kode: BRG-ATK-001)                      |
|  Stok Saat Ini: 50 Rim | Perkiraan Setelah Mutasi: 60 Rim             |
|                                                                       |
|  Arah Mutasi Persediaan *                                             |
|  [ MASUK (Penambahan Stok Baru / Pengadaan)                         V]|
|                                                                       |
|  Jumlah Kuantitas Mutasi *                                            |
|  [ 10                                                               ] |
|                                                                       |
|  Alasan / Keterangan Penyesuaian *                                    |
|  [ Pengadaan rutin triwulan IV dari bagian perlengkapan dinas       ] |
|-----------------------------------------------------------------------|
|                                        [ Batal ]  [ Simpan Penyesuaian]
+-----------------------------------------------------------------------+
```
**Gambar 4.20** Dialog Penyesuaian Kuantitas Stok Fisik

Gambar 4.19 dan Gambar 4.20 memperlihatkan kemudahan pelacakan stok dan visualisasi kalkulasi perkiraan stok baru secara waktu-nyata (*real-time preview*).

---

## 4.5.8 Kelompok FR-13 s.d. FR-15: Modul Tiket Layanan Mandiri dan Pemrosesan Admin

Kelompok kebutuhan ini menangani pengajuan mandiri tiket kebutuhan barang dan laporan kerusakan oleh pegawai, serta pemrosesan persetujuan (ACC dengan pemotongan stok atomik) oleh administrator.

### 1. Struktur Komponen dan State Reaktif
Modul ini didukung oleh tiga komponen utama:
- `TiketPegawaiList.tsx` ([src/modules/tiket/components/TiketPegawaiList.tsx:1-170](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/components/TiketPegawaiList.tsx#L1-L170)): Menampilkan riwayat tiket mandiri pegawai pada `/pegawai/tiket` lengkap dengan nomor tiket `TKT-YYYYMMDD-XXXX`, status badge, kuantitas, tanggal pengajuan, dan catatan admin.
- `TiketFormDialog.tsx` ([src/modules/tiket/components/TiketFormDialog.tsx:46-298](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/components/TiketFormDialog.tsx#L46-L298)): Dialog modal pengajuan tiket oleh pegawai dengan state jenis tiket `jenis` (`'PERMINTAAN_BARANG' | 'LAPOR_KERUSAKAN'`), barang pilihan `barangId`, kuantitas `jumlah`, keperluan `keperluan`, serta evaluasi otomatis kecukupan stok `isStockInsufficient`.
- `TiketAdminTable.tsx` ([src/modules/tiket/components/TiketAdminTable.tsx:1-350](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/tiket/components/TiketAdminTable.tsx#L1-L350)): Tabel pemrosesan tiket administrator pada `/admin/inventaris?tab=tiket` yang menyediakan tombol tindakan langsung "ACC Permintaan", dialog tolak tiket, serta dialog alih status ke "Maintenance".

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Pegawai mengajukan tiket melalui Server Action `createTiketAction`. Form secara otomatis memeriksa ketersediaan stok fisik barang saat jenis tiket berupa permohonan barang.

Berikut merupakan cuplikan kode fungsi submit tiket mandiri oleh pegawai yang disajikan pada Cuplikan Kode 4.9.

```tsx
// src/modules/tiket/components/TiketFormDialog.tsx:81-125
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = createTiketSchema.safeParse({
      barangId,
      jenis,
      jumlah,
      keperluan,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
      return;
    }

    if (isStockInsufficient) {
      setErrorMessage(`Stok barang tidak mencukupi (tersedia: ${selectedBarang?.stok}, diminta: ${jumlah}).`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await createTiketAction(validation.data);
      toast.success(res.message);
      resetForm();
      setOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan tiket layanan.');
    } finally {
      setIsLoading(false);
    }
  };
```

Cuplikan Kode 4.9 membuktikan perlindungan integritas permohonan, di mana sistem menolak pengajuan di sisi klien jika kuantitas barang yang diminta melebihi sisa persediaan fisik di gudang dinas.

### 3. Struktur Antarmuka Pengguna
Pada antarmuka pegawai, daftar tiket disajikan dalam bentuk kartu riwayat dengan indikator status berwarna: Kuning untuk `MENUNGGU`, Hijau untuk `ACC` dan `SELESAI`, Biru untuk `MAINTENANCE`, serta Merah untuk `DITOLAK`. Pada antarmuka administrator, tabel tiket menyajikan rincian pemohon, barang yang diminta, keperluan, tombol ACC instan, dan dropdown penolakan.

Berikut merupakan placeholder layar pengajuan dan riwayat tiket pegawai yang disajikan pada Gambar 4.21.

```text
+--------------------------------------------------------------------------------------------------+
|  Tiket Layanan Mandiri                                                   [ + Ajukan Tiket Baru ] |
|  Ajukan permohonan ATK/perlengkapan dinas dan pantau penanganan laporan kerusakan aset kantor.    |
|--------------------------------------------------------------------------------------------------|
|  +--------------------------------------------------------------------------------------------+  |
|  | #TKT-20261104-A9B2 | Permintaan Barang: Kertas HVS A4 80gsm               [ MENUNGGU ]     |  |
|  | Diajukan: 04 Nov 2026 | Jumlah: 2 Rim                                                      |  |
|  | Keperluan: Kebutuhan cetak draf surat keputusan izin operasional triwulan IV.              |  |
|  | Catatan Admin: -                                                                           |  |
|  +--------------------------------------------------------------------------------------------+  |
|  +--------------------------------------------------------------------------------------------+  |
|  | #TKT-20261102-K3F1 | Lapor Kerusakan: Komputer All-in-One Loket 1         [ MAINTENANCE ]  |  |
|  | Diajukan: 02 Nov 2026 | Jumlah: 1 Unit                                                     |  |
|  | Keperluan: Layar monitor berkedip dan sistem operasi sering mengalami crash saat cetak SK.|  |
|  | Catatan Admin: Unit sedang diperiksa teknisi vendor rekanan dinas.                         |  |
|  +--------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.21** Layar Pengajuan dan Riwayat Tiket Pegawai (`/pegawai/tiket`)

Berikut merupakan placeholder tabel pengendalian tiket layanan oleh administrator yang disajikan pada Gambar 4.22.

```text
+--------------------------------------------------------------------------------------------------+
|  Inventaris & Tiket Layanan                                                                      |
|--------------------------------------------------------------------------------------------------|
|  [ Katalog Barang ]   [ Riwayat Mutasi Stok ]   [ (•) Tiket Permohonan Layanan ]                 |
|--------------------------------------------------------------------------------------------------|
|  [ Cari nomor tiket / pemohon... ]   [ Status: Semua V ]   [ Jenis: Semua V ]                    |
|--------------------------------------------------------------------------------------------------|
|  No. Tiket        | Pemohon      | Jenis Tiket | Barang / Kuantitas | Status     | Aksi Tindakan |
|--------------------------------------------------------------------------------------------------|
|  TKT-20261104-A9B2| Budi Santoso | Permintaan  | Kertas HVS (2 Rim) | [MENUNGGU] | [ACC] [Tolak] |
|  TKT-20261102-K3F1| Siti Rahayu  | Kerusakan   | PC Loket 1 (1 Unit)| [MAINTENAN]| [ Selesaikan ]|
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.22** Tabel Pengendalian dan Persetujuan Tiket oleh Administrator (`/admin/inventaris?tab=tiket`)

Gambar 4.21 dan Gambar 4.22 menggambarkan alur kerja dua arah yang transparan antara staf dinas pemohon dengan tim pengelola perlengkapan dinas.

---

## 4.5.9 Kelompok FR-16 & FR-17: Modul Monitoring Retribusi PBG dan Pelunasan SKRD

Kelompok kebutuhan ini menangani pencatatan ketetapan retribusi Persetujuan Bangunan Gedung (PBG), kontrol keunikan nomor SKRD, deteksi jatuh tempo pembayaran $\le 3$ hari, serta penandaan status pelunasan retribusi dinas.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/admin/pbg` dan dikelola oleh:
- `PbgTable.tsx` ([src/modules/pbg/components/PbgTable.tsx:1-260](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/components/PbgTable.tsx#L1-L260)): Menampilkan tabel daftar ketetapan retribusi dengan filter pencarian pemohon/SKRD/lokasi, dropdown filter status (`BELUM_BAYAR`, `LUNAS`, `JATUH_TEMPO_3_HARI`), tombol tandai lunas instan, tombol batalkan lunas, tombol edit, dan tombol hapus data tagihan.
- `PbgFormDialog.tsx` ([src/modules/pbg/components/PbgFormDialog.tsx:45-263](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/components/PbgFormDialog.tsx#L45-L263)): Modal dialog pencatatan retribusi baru dengan state form `pemohon`, `noWa`, `noSkrd`, `lokasi`, `nominal`, dan `jatuhTempo` (format YYYY-MM-DD).
- `PbgHeaderActions.tsx` ([src/modules/pbg/components/PbgHeaderActions.tsx:1-25](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/pbg/components/PbgHeaderActions.tsx#L1-L25)): Tombol pembuka dialog pendaftaran retribusi baru.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Pencatatan tagihan retribusi memicu Server Action `createPbgAction` atau `updatePbgAction`. Input nomor WhatsApp secara otomatis dinormalisasi menjadi format internasional `628xxx` menggunakan fungsi `normalizeWaNumber` sebelum dikirimkan ke server.

Berikut merupakan cuplikan kode fungsi submit data ketetapan retribusi PBG yang disajikan pada Cuplikan Kode 4.10.

```tsx
// src/modules/pbg/components/PbgFormDialog.tsx:59-110
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      pemohon,
      noWa,
      noSkrd,
      lokasi,
      nominal: Number(nominal),
      jatuhTempo,
    };

    if (isEditing && initialData?.id) {
      const validation = updatePbgSchema.safeParse({ ...payload, id: initialData.id });
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await updatePbgAction(validation.data);
        toast.success(res.message);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal memperbarui tagihan PBG.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const validation = createPbgSchema.safeParse(payload);
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Input formulir tidak valid.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await createPbgAction(validation.data);
        toast.success(res.message);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal mendaftarkan tagihan PBG.');
      } finally {
        setIsLoading(false);
      }
    }
  };
```

Cuplikan Kode 4.10 membuktikan penegakan skema validasi Zod di sisi klien dan server yang memastikan nominal retribusi bernilai positif dan nomor SKRD berformat kapital.

### 3. Struktur Antarmuka Pengguna
Tabel menyajikan Nomor SKRD (font mono), Nama Pemohon, Nomor Kontak (tersensor di server: `62812****7890`), Lokasi Bangunan, Nilai Retribusi (format Rupiah), Batas Jatuh Tempo, Status Pembayaran, dan Tombol Tindakan. Tagihan yang mendekati jatuh tempo $\le 3$ hari disorot dengan badge konteks khusus berwarna kuning.

Berikut merupakan placeholder layar monitoring retribusi PBG yang disajikan pada Gambar 4.23.

```text
+--------------------------------------------------------------------------------------------------+
|  Monitoring Retribusi PBG                                                [ + Catat Tagihan PBG ] |
|  Kelola ketetapan retribusi PBG, pantau pelunasan SKRD, dan kontrol jatuh tempo pembayaran.       |
|--------------------------------------------------------------------------------------------------|
|  [ Cari pemohon / no SKRD / lokasi... ]   [ Filter Status: Jatuh Tempo <= 3 Hari V ]             |
|--------------------------------------------------------------------------------------------------|
|  No. SKRD       | Pemohon           | No. WhatsApp   | Nominal Retribusi | Jatuh Tempo | Status  |
|--------------------------------------------------------------------------------------------------|
|  SKRD-2026-0089 | PT Karawang Maju  | 62812****8899  | Rp 45.000.000     | 06 Nov 2026 | [BELUM] |
|  SKRD-2026-0042 | H. Ahmad Dahlan   | 62857****1234  | Rp 12.500.000     | 01 Nov 2026 | [LUNAS] |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.23** Layar Monitoring Ketetapan Retribusi PBG dan Status SKRD (`/admin/pbg`)

> [!NOTE]
> **Catatan Status Fitur Notifikasi WhatsApp**: Sebagaimana tercatat pada `docs/DECISIONS.md:121-128`, fitur otomatisasi pengiriman pesan WhatsApp pengingat PBG berstatus `[DITANGGUHKAN SEMENTARA DI FASE 4]`. Antarmuka tabel PBG tidak memuat tombol "Kirim Notifikasi Otomatis" atau panel cron, dan penagihan dilakukan manual oleh petugas loket dinas.

---

## 4.5.10 Kelompok FR-18: Modul Profil Aparatur dan Keamanan Kata Sandi

Kelompok kebutuhan ini menangani penyajian identitas profil kedinasan pegawai (dalam mode baca) serta fasilitas mandiri untuk melakukan pembaruan kata sandi akun aparatur.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada rute `/pegawai/profil` dan dikelola oleh komponen tunggal terpadu `ProfilView.tsx` ([src/modules/profil/components/ProfilView.tsx:35-204](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/profil/components/ProfilView.tsx#L35-L204)). Formulir kata sandi dikendalikan oleh React Hook Form dengan resolver Zod `changePasswordSchema` dan hook transisi reaktif `React.useTransition` (`isPending`).

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Pembaruan kata sandi memanggil Server Action `changePasswordAction`. Sistem memvalidasi bahwa kata sandi saat ini benar, kata sandi baru minimal 8 karakter, dan secara otomatis mencabut sesi aktif pada perangkat lain via opsi `revokeOtherSessions: true`.

Berikut merupakan cuplikan kode fungsi pembaruan kata sandi mandiri yang disajikan pada Cuplikan Kode 4.11.

```tsx
// src/modules/profil/components/ProfilView.tsx:52-62
  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(data);
        toast.success(result.message);
        reset();
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengubah password');
      }
    });
  };
```

Cuplikan Kode 4.11 menunjukkan penggunaan `startTransition` React 19 yang menjaga antarmuka tetap responsif saat mutasi kriptografis Scrypt dan pencabutan sesi di basis data sedang diproses.

### 3. Struktur Antarmuka Pengguna
Halaman dibagi menjadi tata letak dua kolom: kolom kiri menampilkan kartu informasi identitas kedinasan aparatur (Avatar inisial huruf, Nama lengkap, Username, NIP, Bidang Dinas, Peran, dan Status Aktif), sedangkan kolom kanan memuat kartu keamanan berisi formulir perubahan kata sandi mandiri.

Berikut merupakan placeholder layar profil aparatur dan ubah kata sandi yang disajikan pada Gambar 4.24.

```text
+--------------------------------------------------------------------------------------------------+
|  Profil & Keamanan Akun                                                                          |
|  Kelola informasi aparatur dan keamanan kata sandi akun SIMOP DPMPTSP Karawang.                  |
|--------------------------------------------------------------------------------------------------|
|  [ Kolom Kiri: Data Identitas Aparatur ]      |  [ Kolom Kanan: Keamanan Kata Sandi Mandiri ]    |
|  +-----------------------------------------+  |  +--------------------------------------------+  |
|  | ( B ) Budi Santoso, S.Kom.              |  |  | Perbarui Kata Sandi Akun                   |  |
|  |       @pegawai_ptsp  [ Akun Aktif ]      |  |  | Sandi minimal 8 karakter. Sesi di perangkat|  |
|  |-----------------------------------------|  |  | lain akan otomatis dibatalkan.             |  |
|  | NIP: 198805122010011002                 |  |  |--------------------------------------------|  |
|  | Bidang: PTSP (Pelayanan Terpadu)        |  |  | Kata Sandi Saat Ini *                      |  |
|  | Peran: Aparatur Pelaksana (PEGAWAI)     |  |  | [ ****************                     (O) ]|  |
|  | Status Sesi: Terhubung (Perangkat Ini)  |  |  | Kata Sandi Baru *                          |  |
|  +-----------------------------------------+  |  | [ ****************                     (O) ]|  |
|                                               |  | Konfirmasi Kata Sandi Baru *               |  |
|                                               |  | [ ****************                     (O) ]|  |
|                                               |  |                      [ Simpan Kata Sandi ] |  |
|                                               |  +--------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.24** Layar Profil Aparatur dan Pembaruan Kata Sandi Mandiri (`/pegawai/profil`)

Gambar 4.24 memperlihatkan pemisahan tegas antara data identitas kepegawaian yang dilindungi (hanya dapat diubah oleh administrator) dengan fungsi keamanan kredensial mandiri yang dapat diperbarui secara fleksibel oleh aparatur bersangkutan.

---

## 4.5.11 Kelompok FR-19: Modul Pencarian Cepat Global (CommandMenu Cmd+K)

Kelompok kebutuhan ini menangani kemampuan pencarian instan berbasis palet perintah (*command palette*) yang dapat diakses dari halaman mana pun menggunakan pintasan keyboard `Cmd+K` atau `Ctrl+K`.

### 1. Struktur Komponen dan State Reaktif
Modul ini diimplementasikan pada komponen `CommandMenu.tsx` ([src/components/shared/CommandMenu.tsx:28-200](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/shared/CommandMenu.tsx#L28-L200)) yang disuntikkan secara global pada `AppShell.tsx`. Komponen mengelola tiga variabel state:
- `query` (`string`): Teks kata kunci pencarian yang dimasukkan pengguna.
- `searchResults` (`SearchResultItem[]`): Daftar hasil pencarian dari Server Action yang dibatasi maksimal 8 item.
- `isSearching` (`boolean`): Indikator pemuatan data (*spinner*) saat proses kueri berlangsung.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Komponen mendengarkan kombinasi tombol keyboard global dan menerapkan teknik *debouncing* 250 milidetik sebelum mengeksekusi Server Action `globalSearchAction`.

Berikut merupakan cuplikan kode listener pintasan keyboard dan eksekusi pencarian yang disajikan pada Cuplikan Kode 4.12.

```tsx
// src/components/shared/CommandMenu.tsx:48-89
  // Shortcut keyboard listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        handleOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, handleOpenChange]);

  // Debounced search effect (250ms)
  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await globalSearchAction(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);
```

Cuplikan Kode 4.12 memastikan bahwa pencarian hanya dieksekusi jika panjang kata kunci minimal 2 karakter, dengan penundaan 250 ms untuk menghemat konsumsi kueri basis data Neon saat pengguna masih mengetik.

### 3. Struktur Antarmuka Pengguna
Palet perintah muncul di tengah layar berupa dialog modal mengambang dengan latar belakang kabur (*backdrop blur*), kotak masukan kata kunci pencarian, daftar navigasi cepat rute menu, dan kelompok hasil pencarian berikon yang terisolasi peran.

Berikut merupakan placeholder dialog palet perintah pencarian cepat global yang disajikan pada Gambar 4.25.

```text
+-----------------------------------------------------------------------------------+
|  [ Ikon Kaca Pembesar ]  Ketik perintah atau cari data...                  [ESC]  |
|-----------------------------------------------------------------------------------|
|  HASIL PENCARIAN SISTEM                                                           |
|  [ Ikon User ]     Budi Santoso, S.Kom.                                           |
|                    @pegawai_ptsp • Bidang PTSP (PEGAWAI)                          |
|                                                                                   |
|  [ Ikon Package ]  Kertas HVS A4 80gsm                                            |
|                    Kode: BRG-ATK-001 • Stok: 50 Rim                               |
|                                                                                   |
|  [ Ikon Dokumen ]  PT Karawang Maju Mandiri                                       |
|                    SKRD: SKRD-2026-0089 • Status: BELUM_BAYAR                     |
|-----------------------------------------------------------------------------------|
|  NAVIGASI CEPAT                                                                   |
|  [ Ikon Kalender ] Buat Penugasan Jadwal Baru                                     |
|  [ Ikon Kotak ]    Katalog Barang & Inventaris                                    |
+-----------------------------------------------------------------------------------+
```
**Gambar 4.25** Dialog Palet Perintah Pencarian Cepat Global (Cmd+K)

Gambar 4.25 memperlihatkan integrasi pencarian cerdas yang mempercepat akses aparatur terhadap arsip data dinas tanpa harus membuka menu satu per satu.

---

## 4.5.12 Kelompok FR-20: Modul Dashboard Terpadu dan Visualisasi Metrik

Kelompok kebutuhan ini menyajikan visualisasi data operasional dinas, ringkasan capaian kinerja penugasan mingguan berstandar WIB, serta kartu-kartu aksi cepat operasional terpadu.

### 1. Struktur Komponen dan State Reaktif
Modul ini bertempat pada halaman `/dashboard` (`src/app/(app)/dashboard/page.tsx`) yang mengevaluasi peran pengguna dan merender komponen visual yang sesuai:
- `AdminDashboard.tsx` ([src/modules/dashboard/components/AdminDashboard.tsx:27-188](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/dashboard/components/AdminDashboard.tsx#L27-L188)): Menyajikan baris 4 kartu metrik utama (`StatCard`), visualisasi `DonutChart` distribusi penugasan hari ini, serta panel operasional `AdminDashboardPanels.tsx` yang memuat antrean laporan menunggu verifikasi dan daftar barang dengan stok menipis $\le$ limit stok.
- `PegawaiDashboard.tsx` ([src/modules/dashboard/components/PegawaiDashboard.tsx:1-180](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/dashboard/components/PegawaiDashboard.tsx#L1-L180)): Menyajikan ringkasan kalender mingguan berstandar WIB (Senin s.d. Minggu), visualisasi `ProgressRing` persentase capaian penyelesaian tugas, tombol aksi cepat, serta linimasa penugasan minggu berjalan via `PegawaiTaskList.tsx`.
- `DonutChart.tsx` ([src/components/shared/DonutChart.tsx:1-110](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/components/shared/DonutChart.tsx#L1-L110)): Visualisasi grafik donat SVG murni tanpa ketergantungan pustaka eksternal dengan palet warna *Zero-Indigo* Genesis.

### 2. Fungsi Pengendali dan Cuplikan Kode Sumber
Komponen dashboard menerima data matang (*hydrated props*) dari kueri SQL server `getAdminDashboardStats()` atau `getPegawaiDashboardStats(userId)` ([src/modules/dashboard/queries.ts:60-239](file:///c:/Users/DELL%203420/Documents/jun/KP-SIMOP/src/modules/dashboard/queries.ts#L60-L239)).

Berikut merupakan cuplikan kode pemetaan segmen warna Donut Chart distribusi tugas dinas yang disajikan pada Cuplikan Kode 4.13.

```tsx
// src/modules/dashboard/components/AdminDashboard.tsx:30-52
  const donutSegments = [
    {
      label: 'Kantor Dinas',
      value: penugasanHariIni.kantor,
      color: 'var(--color-chart-3)', // Slate Netral
    },
    {
      label: 'Loket Pelayanan',
      value: penugasanHariIni.loket,
      color: 'var(--color-chart-1)', // Emerald
    },
    {
      label: 'Layanan Kecamatan',
      value: penugasanHariIni.kecamatan,
      color: 'var(--color-chart-2)', // Amber
    },
    {
      label: 'Lainnya / Lapangan',
      value: penugasanHariIni.lainnya,
      color: 'var(--color-chart-4)', // Sky Cyan
    },
  ];
```

Cuplikan Kode 4.13 memperlihatkan kepatuhan terhadap aturan sistem desain `docs/DESIGN.md` bahwa warna primer Indigo `#5047E5` tidak boleh digunakan untuk bagan data, melainkan menggunakan variabel CSS token mandiri `var(--color-chart-1)` hingga `var(--color-chart-4)`.

### 3. Struktur Antarmuka Pengguna
Dashboard administrator memadukan kartu statistik 3 tingkat (label, angka besar tabular, badge konteks), diagram donat akumulasi tugas di pusat donat, antrean verifikasi laporan, dan daftar barang menipis. Dashboard pegawai menyajikan visualisasi *Progress Ring* persentase tugas selesai dan linimasa jadwal mingguan.

Berikut merupakan placeholder tampilan Dashboard Administrator yang disajikan pada Gambar 4.26.

```text
+--------------------------------------------------------------------------------------------------+
|  Pusat Kendali Operasional                                                                       |
|  SIMOP DPMPTSP Kabupaten Karawang • Bidang SEKRETARIAT                                            |
|--------------------------------------------------------------------------------------------------|
|  [ Pegawai Aktif ]       [ Bertugas Hari Ini ]    [ Tiket Menunggu ]       [ PBG Jatuh Tempo ]   |
|  12 Aparatur             8 Pegawai Unik           3 Perlu ACC              2 Tagihan (<=3 Hari)  |
|  Aparatur terdaftar      10 akumulasi tugas       Permintaan & perbaikan   Tagihan mendekati tmpo|
|--------------------------------------------------------------------------------------------------|
|  [ Donut Chart Distribusi ]       |  [ Antrean Verifikasi Laporan ]                              |
|                                   |  • Piket Front Office PTSP - Budi Santoso (Loket 1)          |
|          (( 10 Tugas ))           |  • Pengawasan PBG Telukjambe - Siti Rahayu (Kecamatan)       |
|                                   |  [ Lihat Semua Laporan Antrean -> ]                          |
|  • Kantor: 4  • Loket: 3          |--------------------------------------------------------------|
|  • Kecamatan: 2  • Lapangan: 1    |  [ Peringatan Stok Barang Menipis ]                          |
|                                   |  • Tinta Printer Epson (Sisa: 2 Botol | Batas: 5)            |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.26** Layar Dashboard Administrator dengan Donut Chart Distribusi Tugas (`/dashboard`)

Berikut merupakan placeholder tampilan Dashboard Pegawai yang disajikan pada Gambar 4.27.

```text
+--------------------------------------------------------------------------------------------------+
|  Dashboard Tugas Pegawai                                                                         |
|  Selamat datang kembali, Budi Santoso, S.Kom. • Bidang PTSP                                       |
|--------------------------------------------------------------------------------------------------|
|  [ Progress Capaian Tugas ]       |  [ Aksi Cepat Mandiri ]                                      |
|                                   |  [ + Kirim Laporan Tugas ]     [ + Ajukan Tiket Layanan ]    |
|          (( 75% ))                |--------------------------------------------------------------|
|        Tuntas Minggu Ini          |  [ Jadwal Tugas Minggu Ini (02 Nov - 08 Nov 2026) ]          |
|                                   |  • Senin, 02 Nov: Piket Loket Perizinan        [ SELESAI ]   |
|  Total: 4 Tugas | Selesai: 3      |  • Rabu, 04 Nov: Piket Loket 1 Lantai 1        [ BELUM ]     |
|  Menunggu Verifikasi: 1           |  • Jumat, 06 Nov: Evaluasi SOP Pelayanan       [ BELUM ]     |
+--------------------------------------------------------------------------------------------------+
```
**Gambar 4.27** Layar Dashboard Pegawai dengan Progress Ring Capaian Tugas (`/dashboard`)

Gambar 4.26 dan Gambar 4.27 mengilustrasikan pemisahan visual yang sangat ergonomis antara kebutuhan kendali eksekutif administrator dengan kebutuhan operasional harian aparatur pelaksana.

---

## 4.5.13 Matriks Keterlacakan Antarmuka Pengguna (*Frontend Traceability Matrix*)

Matriks keterlacakan antarmuka pengguna memetakan hubungan ketergantungan antara Kebutuhan Fungsional (FR) dengan komponen antarmuka, variabel *state* internal, fungsi penanganan (*handlers*), serta antarmuka Server Action / Endpoint API yang dieksekusi.

Berikut merupakan matriks keterlacakan antarmuka pengguna yang disajikan pada Tabel 4.46.

**Tabel 4.46** Matriks Keterlacakan Antarmuka Pengguna (*Frontend Traceability Matrix*)
| ID FR | Komponen Halaman / Dialog | Variabel State Kunci | Fungsi Penanganan (*Handler*) | Server Action / Endpoint Terhubung |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | `LoginForm.tsx` | `username`, `password`, `isLoading`, `errorMessage` | `handleSubmit` | `POST /api/auth/sign-in/username` (Better Auth) |
| **FR-02** | `AppShell.tsx`, `SidebarUserCard.tsx` | `collapsed` | `handleSignOut` | `POST /api/auth/sign-out` (Better Auth) |
| **FR-03** | `PegawaiFormDialog.tsx` | `name`, `username`, `password`, `nip`, `bidang` | `handleSubmit` | `createPegawaiAction` |
| **FR-04** | `PegawaiFormDialog.tsx` | `name`, `nip`, `bidang`, `isLoading` | `handleSubmit` | `updatePegawaiAction` |
| **FR-05** | `PegawaiTable.tsx`, `ConfirmDialog.tsx` | `toggleUser`, `isConfirmOpen`, `isToggling` | `handleToggleStatus` | `togglePegawaiStatusAction` |
| **FR-06** | `ResetPasswordDialog.tsx` | `newPassword`, `isLoading` | `handleResetPassword` | `resetPegawaiPasswordAction` |
| **FR-07** | `JadwalFormDialog.tsx` | `selectedPegawaiIds`, `skipWeekends`, `isSubmitting` | `onSubmit` | `createJadwalRangeAction` |
| **FR-08** | `JadwalAdminTable.tsx`, `ConfirmDialog.tsx` | `deleteTargetId`, `isDeleting` | `handleDeleteJadwal` | `deleteJadwalAction` |
| **FR-09** | `UploadLaporanDialog.tsx`, `FileDropzone.tsx` | `fotoFile`, `pdfFile`, `isSubmitting`, `errorMessage` | `handleSubmit` | `POST /api/uploads/sign`, `submitLaporanAction` |
| **FR-10** | `VerifikasiDialog.tsx` | `catatan`, `fotoUrl`, `pdfUrl`, `isSubmitting`, `actionType` | `handleDecision` | `GET /api/uploads/preview`, `verifikasiJadwalAction` |
| **FR-11** | `BarangTable.tsx`, `BarangFormDialog.tsx` | `nama`, `kategori`, `stok`, `limitStok`, `satuan` | `handleSubmit`, `handleDeleteOrArchive` | `createBarangAction`, `updateBarangAction`, `deleteOrArchiveBarangAction` |
| **FR-12** | `AdjustStokDialog.tsx` | `tipe`, `jumlah`, `keterangan`, `isLoading` | `handleSubmit` | `adjustStokAction` |
| **FR-13** | `TiketFormDialog.tsx` | `jenis`, `barangId`, `jumlah`, `keperluan`, `errorMessage` | `handleSubmit` | `createTiketAction` |
| **FR-14** | `TiketAdminTable.tsx` | `isProcessingAcc`, `catatanAdmin` | `handleAccTiket` | `accTiketAction` |
| **FR-15** | `TiketAdminTable.tsx` | `targetStatus`, `catatanTolak` | `handleUpdateStatus` | `updateTiketStatusAction` |
| **FR-16** | `PbgFormDialog.tsx` | `pemohon`, `noWa`, `noSkrd`, `lokasi`, `nominal`, `jatuhTempo` | `handleSubmit` | `createPbgAction`, `updatePbgAction` |
| **FR-17** | `PbgTable.tsx` | `statusFilter`, `search`, `isMarkingLunas` | `handleMarkLunas`, `handleUnmarkLunas` | `getPbgList`, `markPbgLunasAction`, `unmarkPbgLunasAction` |
| **FR-18** | `ProfilView.tsx` | `isPending` | `onSubmit` | `changePasswordAction` |
| **FR-19** | `CommandMenu.tsx` | `open`, `query`, `searchResults`, `isSearching` | `handleOpenChange`, `handleSelect` | `globalSearchAction` |
| **FR-20** | `AdminDashboard.tsx`, `PegawaiDashboard.tsx` | Props `data` (Statistik Terhidrasi Server) | Client Rendering & Navigation Links | `getAdminDashboardStats`, `getPegawaiDashboardStats` |

Tabel 4.46 membuktikan bahwa seluruh 20 kebutuhan fungsional telah memiliki pemetaan komponen antarmuka yang konkrit dan dapat diverifikasi langsung pada basis kode perangkat lunak SIMOP DPMPTSP.

---

## 4.5.14 Daftar Bukti Pemeriksaan Berkas

Berikut merupakan berkas-berkas sumber yang dibaca dan diperiksa secara langsung dalam penyusunan subbab implementasi antarmuka pengguna ini:
1. `package.json` (baris 1–71)
2. `src/app/layout.tsx` (baris 1–45)
3. `src/app/page.tsx` (baris 1–15)
4. `src/app/(app)/layout.tsx` (baris 1–42)
5. `src/app/(app)/admin/layout.tsx` (baris 1–30)
6. `src/app/(app)/dashboard/page.tsx` (baris 1–43)
7. `src/app/(app)/admin/pegawai/page.tsx` (baris 1–32)
8. `src/app/(app)/admin/jadwal/page.tsx` (baris 1–36)
9. `src/app/(app)/admin/verifikasi/page.tsx` (baris 1–31)
10. `src/app/(app)/admin/inventaris/page.tsx` (baris 1–41)
11. `src/app/(app)/admin/pbg/page.tsx` (baris 1–34)
12. `src/app/(app)/pegawai/jadwal/page.tsx` (baris 1–31)
13. `src/app/(app)/pegawai/tiket/page.tsx` (baris 1–38)
14. `src/app/(app)/pegawai/profil/page.tsx` (baris 1–28)
15. `src/app/(auth)/login/page.tsx` (baris 1–12)
16. `src/components/layout/AppShell.tsx` (baris 1–131)
17. `src/components/layout/Sidebar.tsx` (baris 1–105)
18. `src/components/layout/SidebarNav.tsx` (baris 1–150)
19. `src/components/layout/SidebarUserCard.tsx` (baris 1–145)
20. `src/components/layout/TopHeader.tsx` (baris 1–125)
21. `src/components/layout/MobileSidebarDrawer.tsx` (baris 1–95)
22. `src/components/layout/QuickActionDropdown.tsx` (baris 1–110)
23. `src/components/shared/CommandMenu.tsx` (baris 1–200)
24. `src/components/shared/DataTable.tsx` (baris 1–180)
25. `src/components/shared/FileDropzone.tsx` (baris 1–120)
26. `src/components/shared/ConfirmDialog.tsx` (baris 1–68)
27. `src/components/shared/DonutChart.tsx` (baris 1–110)
28. `src/components/shared/ProgressRing.tsx` (baris 1–80)
29. `src/components/shared/StatCard.tsx` (baris 1–95)
30. `src/modules/auth/components/LoginForm.tsx` (baris 1–121)
31. `src/modules/pegawai/components/PegawaiTable.tsx` (baris 1–278)
32. `src/modules/pegawai/components/PegawaiFormDialog.tsx` (baris 1–209)
33. `src/modules/pegawai/components/ResetPasswordDialog.tsx` (baris 1–96)
34. `src/modules/jadwal/components/JadwalAdminTable.tsx` (baris 1–260)
35. `src/modules/jadwal/components/JadwalFormDialog.tsx` (baris 1–306)
36. `src/modules/jadwal/components/JadwalPegawaiTimeline.tsx` (baris 1–240)
37. `src/modules/jadwal/components/UploadLaporanDialog.tsx` (baris 1–220)
38. `src/modules/verifikasi/components/VerifikasiQueue.tsx` (baris 1–85)
39. `src/modules/verifikasi/components/VerifikasiCard.tsx` (baris 1–95)
40. `src/modules/verifikasi/components/VerifikasiDialog.tsx` (baris 1–316)
41. `src/modules/inventaris/components/InventarisTabs.tsx` (baris 1–85)
42. `src/modules/inventaris/components/BarangTable.tsx` (baris 1–270)
43. `src/modules/inventaris/components/BarangFormDialog.tsx` (baris 1–244)
44. `src/modules/inventaris/components/AdjustStokDialog.tsx` (baris 1–198)
45. `src/modules/inventaris/components/StokLogTable.tsx` (baris 1–135)
46. `src/modules/tiket/components/TiketPegawaiList.tsx` (baris 1–170)
47. `src/modules/tiket/components/TiketFormDialog.tsx` (baris 1–298)
48. `src/modules/tiket/components/TiketAdminTable.tsx` (baris 1–350)
49. `src/modules/pbg/components/PbgTable.tsx` (baris 1–260)
50. `src/modules/pbg/components/PbgFormDialog.tsx` (baris 1–263)
51. `src/modules/profil/components/ProfilView.tsx` (baris 1–204)
52. `src/modules/dashboard/components/AdminDashboard.tsx` (baris 1–188)
53. `src/modules/dashboard/components/PegawaiDashboard.tsx` (baris 1–180)
54. `src/config/navigation.ts` (baris 1–185)

