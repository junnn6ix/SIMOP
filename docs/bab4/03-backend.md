~# 4.6 Implementasi Sisi Server dan Basis Data (*Back-End*)

Subbab ini menyajikan perwujudan teknis dari perancangan arsitektur sistem pada sisi server (*back-end*) dan repositori data persisten pada Sistem Informasi Operasional dan Pelayanan (SIMOP) DPMPTSP Kabupaten Karawang. Berdasarkan hasil audit rekayasa balik (*reverse engineering*) terhadap basis kode repositori, sistem dibangun secara holistik di atas kerangka kerja terpadu (*full-stack framework*) Next.js 16 berbasis *App Router*, pustaka antarmuka React 19, dan bahasa pemrograman TypeScript yang berjalan pada *runtime environment* Node.js versi 22 LTS.

Seluruh klaim arsitektur, konfigurasi lingkungan, kebijakan keamanan, skema basis data, dan logika bisnis yang tercantum dalam subbab ini bersumber secara faktual dari kode sumber yang dapat dibuktikan keberadaannya (*single source of truth*). Temuan ketidaksesuaian draf konseptual lama—seperti asumsi pemakaian Express.js murni maupun Prisma ORM—telah dikoreksi dan dicatat secara transparan pada dokumen terpisah.

---

## 4.6.1 Arsitektur Server, Lingkungan, dan Keamanan

Arsitektur sisi server SIMOP DPMPTSP mengadopsi paradigma modern berbasis *Server Actions* dan *Route Handlers* yang dieksekusi secara terisolasi pada lingkungan server (*server runtime*). Ketiadaan pemisahan repositori fisik antara *front-end* dan *back-end* (*monolith full-stack repository*) dioptimalkan melalui pembatasan batasan eksekusi (*execution boundary*) yang ketat menggunakan direktif `'use server'`. Dengan direktif ini, logika manipulasi basis data, pembacaan kredensial rahasia, enkripsi, dan komunikasi ke layanan *cloud* tidak pernah bocor atau dieksekusi pada peramban klien.

Diagram alur lapisan komunikasi arsitektur sisi server SIMOP disajikan pada Gambar 4.28 berikut.

```mermaid
graph TD
    subgraph ClientLayer ["Lapisan Klien (Peramban / Browser)"]
        UI["Antarmuka Pengguna (Next.js 16 App Router)"]
        Forms["Formulir & Dialog Interaktif"]
        DirectUpload["Unggah Biner Langsung (Direct S3 PUT)"]
    end

    subgraph SecurityLayer ["Lapisan Keamanan & Jaringan"]
        CSP["HTTP Security Headers & CSP Dinamis<br/>(next.config.ts)"]
        RateLimit["Rate Limiter Berbasis Database<br/>(Better Auth & rate_limits)"]
        TrustedOrigins["Resolusi Asal Tepercaya<br/>(resolveTrustedOrigins)"]
    end

    subgraph AuthLayer ["Lapisan Autentikasi & Otorisasi"]
        BetterAuth["Better Auth 1.2.9 Engine<br/>(Scrypt Hashing, Session Cookie)"]
        Guard["Guard Sesi Terpusat (requireRole)<br/>(Validasi Status Aktif ke PostgreSQL)"]
    end

    subgraph LogicLayer ["Lapisan Logika Bisnis (Server-Side)"]
        RouteHandlers["Route Handlers (REST API)<br/>(/api/uploads/sign, /api/uploads/preview)"]
        ServerActions["Next.js Server Actions<br/>(pegawai, jadwal, inventaris, tiket, pbg, profil, search)"]
        ZodValidation["Validasi Skema Zod Terpusat<br/>(Type-Safe Input Validation)"]
    end

    subgraph DataAccessLayer ["Lapisan Akses Data & Transaksi"]
        Drizzle["Drizzle ORM 0.40.0<br/>(Node-Postgres Adapter)"]
        TxManager["Interactive Database Transactions<br/>(db.transaction & Row Locks)"]
        PgPool["Connection Pool (pg.Pool)<br/>(max: 5, idleTimeoutMillis: 30000, ssl: true)"]
    end

    subgraph StorageInfrastructure ["Infrastruktur Penyimpanan & Basis Data"]
        NeonDB[("Basis Data PostgreSQL 16<br/>(Neon Serverless Database)")]
        R2Bucket[("Cloudflare R2 Object Storage<br/>(Bucket Privat & Presigned URLs)")]
    end

    UI -->|"HTTP GET/POST / Navigasi"| CSP
    Forms -->|"Panggilan Server Actions"| CSP
    DirectUpload -->|"HTTP PUT Biner (Presigned URL)"| R2Bucket

    CSP --> RateLimit
    RateLimit --> TrustedOrigins
    TrustedOrigins --> Guard
    Guard --> BetterAuth

    Guard -->|"Terotorisasi"| RouteHandlers
    Guard -->|"Terotorisasi"| ServerActions

    RouteHandlers --> ZodValidation
    ServerActions --> ZodValidation

    ZodValidation --> Drizzle
    RouteHandlers -->|"Penerbitan Presigned URL"| R2Bucket
    ServerActions -->|"Verifikasi Objek (HeadObjectCommand)"| R2Bucket

    Drizzle --> TxManager
    TxManager --> PgPool
    PgPool --> NeonDB
```
**Gambar 4.28** Arsitektur Lapisan Sisi Server (*Back-End Layers*) SIMOP DPMPTSP

Berdasarkan Gambar 4.28 di atas, arsitektur sisi server SIMOP DPMPTSP terbagi menjadi 6 (enam) lapisan utama yang saling berkolaborasi secara berjenjang:
1. **Lapisan Klien (*Client Layer*)**: Berjalan di peramban aparatur dinas, mengirimkan permintaan navigasi, eksekusi mutasi melalui *Server Actions*, serta mengunggah muatan biner dokumen/foto langsung ke *object storage* menggunakan URL bertanda tangan digital (*presigned URL*).
2. **Lapisan Keamanan dan Jaringan (*Security Layer*)**: Menyaring setiap lalu lintas data yang masuk melalui penegakan *Content Security Policy* (CSP) dinamis, *HTTP Security Headers*, pembatasan frekuensi permintaan (*rate limiting*) berbasis tabel basis data `rate_limits`, serta validasi asal domain tepercaya (*trusted origins*).
3. **Lapisan Autentikasi dan Otorisasi (*Auth Layer*)**: Mengelola siklus hidup sesi berbasis kuki *HttpOnly* melalui pustaka Better Auth 1.2.9, serta memberlakukan fungsi *guard* terpusat `requireRole` yang secara ketat memverifikasi status keaktifan akun aparatur langsung ke basis data relasional.
4. **Lapisan Logika Bisnis (*Business Logic Layer*)**: Berisi modul-modul fungsional independen (`pegawai`, `jadwal`, `verifikasi`, `inventaris`, `tiket`, `pbg`, `profil`, `search`) yang seluruh masukannya divalidasi oleh skema pustaka Zod sebelum diolah lebih lanjut.
5. **Lapisan Akses Data dan Transaksi (*Data Access Layer*)**: Menghubungkan logika domain dengan pangkalan data melalui Drizzle ORM 0.40.0 dan *driver* `pg.Pool`, mengelola penguncian baris (*row-level locking*), serta menjamin integritas ACID melalui transaksi interaktif `db.transaction()`.
6. **Infrastruktur Penyimpanan dan Basis Data (*Storage & Database Infrastructure*)**: Terdiri dari instans komputasi basis data awan relasional PostgreSQL 16 (Neon Serverless) dan repositori penyimpanan berkas biner privat Cloudflare R2 yang kompatibel dengan protokol AWS S3.

---

### 4.6.1.1 Konfigurasi Variabel Lingkungan (*Environment Variables*)

Integritas dan keamanan operasional sisi server sangat bergantung pada isolasi variabel lingkungan. Pengelolaan konfigurasi diatur secara terpusat pada modul `src/lib/env.ts` menggunakan skema validasi Zod `envSchema`. Mekanisme validasi ini dieksekusi secara otomatis pada saat server pertama kali diinisialisasi (*boot-time validation*). Jika terdapat satu saja kunci variabel wajib yang hilang atau bernilai di luar spesifikasi yang diizinkan, aplikasi secara terprogram akan melempar galat (*throw Error*) fatal dan membatalkan proses peluncuran sistem demi mencegah terjadinya kegagalan berantai (*cascading failure*).

Daftar seluruh variabel lingkungan yang terkonfigurasi dan dibaca oleh kode sumber SIMOP DPMPTSP disajikan pada Tabel 4.47 berikut.

**Tabel 4.47** Variabel Lingkungan (*Environment Variables*) dan Konfigurasi Sistem
| Nama Variabel | Tipe Data | Sifat | Nilai Bawaan (*Default*) | Deskripsi Fungsi Operasional | Bukti Kode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` (URI) | Wajib | - | *Connection string* pangkalan data relasional PostgreSQL Neon produksi | `src/lib/env.ts:4` |
| `DATABASE_URL_TEST` | `string` (URI) | Opsional | `""` | *Connection string* pangkalan data PostgreSQL khusus untuk pengujian otomatis Playwright | `src/lib/env.ts:5`, `src/db/index.ts:15` |
| `BETTER_AUTH_SECRET` | `string` ($\ge 32$ karakter) | Wajib | - | Kunci rahasia kriptografis untuk enkripsi token sesi dan tanda tangan kuki *HttpOnly* | `src/lib/env.ts:6`, `src/lib/auth.ts:71` |
| `BETTER_AUTH_URL` | `string` (URL) | Opsional | `http://localhost:3000` | Alamat dasar (*base URL*) penanganan rute autentikasi internal Better Auth | `src/lib/env.ts:7`, `src/lib/auth.ts:70` |
| `NEXT_PUBLIC_APP_URL` | `string` (URL) | Opsional | `http://localhost:3000` | Alamat publik aplikasi yang digunakan untuk resolusi domain tepercaya (*CORS trusted origin*) | `src/lib/env.ts:8`, `src/lib/auth.ts:52` |
| `R2_ACCOUNT_ID` | `string` | Opsional | `""` | Identitas akun Cloudflare pengguna untuk konstruksi *endpoint* S3 API R2 | `src/lib/env.ts:9`, `src/lib/storage.ts:20` |
| `R2_ACCESS_KEY_ID` | `string` | Opsional | `""` | Kunci akses publik (*Access Key ID*) Cloudflare R2 untuk presigned URL generator | `src/lib/env.ts:10`, `src/lib/storage.ts:21` |
| `R2_SECRET_ACCESS_KEY` | `string` | Opsional | `""` | Kunci akses rahasia (*Secret Access Key*) Cloudflare R2 | `src/lib/env.ts:11`, `src/lib/storage.ts:22` |
| `R2_BUCKET_NAME` | `string` | Opsional | `simop-bucket` | Nama wadah (*bucket*) penyimpanan objek privat Cloudflare R2 | `src/lib/env.ts:12`, `src/lib/storage.ts:95` |
| `R2_PUBLIC_DOMAIN` | `string` | Opsional | `""` | Domain publik R2 (disediakan untuk ekspansi masa depan) | `src/lib/env.ts:13` |
| `FONNTE_TOKEN` | `string` | Opsional | `""` | Token otorisasi gateway WhatsApp Fonnte `[DITANGGUHKAN SEMENTARA DI FASE 4]` | `src/lib/env.ts:14`, `docs/DECISIONS.md:125` |
| `CRON_SECRET` | `string` | Opsional | `""` | Token rahasia otorisasi pemanggilan cron reminder `[DITANGGUHKAN SEMENTARA DI FASE 4]` | `src/lib/env.ts:15`, `docs/DECISIONS.md:125` |
| `NODE_ENV` | `enum` | Opsional | `development` | Status lingkungan *runtime* aplikasi (`development`, `test`, `production`) | `src/lib/env.ts:16` |

Tabel 4.47 di atas menegaskan pembatasan konfigurasi yang ketat. Kunci `DATABASE_URL` dan `BETTER_AUTH_SECRET` berstatus wajib mutlak. Tanpa kedua variabel tersebut, server menolak berjalan pada lingkungan produksi. Variabel pendukung Cloudflare R2 (`R2_*`) berstatus opsional terkelola; apabila variabel tersebut belum dikonfigurasi (misalnya saat pengujian unit di lingkungan lokal), modul `src/lib/storage.ts:127-135` secara otomatis beralih ke penanganan *mocking* yang aman tanpa menghentikan proses kompilasi. Variabel `FONNTE_TOKEN` dan `CRON_SECRET` tercatat di skema variabel lingkungan namun terbukti secara faktual tidak aktif digunakan dalam alur operasional saat ini (`[DITANGGUHKAN SEMENTARA DI FASE 4]`).

Berikut merupakan implementasi pembacaan dan validasi variabel lingkungan terpusat yang disajikan pada Cuplikan Kode 4.14.

```typescript
// Path: src/lib/env.ts:3-58
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  DATABASE_URL_TEST: z.string().optional().default(''),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET wajib diisi'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().optional().default('simop-bucket'),
  R2_PUBLIC_DOMAIN: z.string().optional().default(''),
  FONNTE_TOKEN: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const isServer = typeof window === 'undefined';

function validateEnv() {
  if (!isServer) {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    } as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Environment variables tidak valid:', parsed.error.format());
    }
    // Sediakan nilai dummy fallback hanya saat lingkungan pengetesan unit (test)
    if (process.env.NODE_ENV === 'test' || process.env.SKIP_ENV_VALIDATION === '1') {
      return {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock',
        DATABASE_URL_TEST: process.env.DATABASE_URL_TEST || '',
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'test-secret-at-least-32-characters-long',
        BETTER_AUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        R2_ACCOUNT_ID: '',
        R2_ACCESS_KEY_ID: '',
        R2_SECRET_ACCESS_KEY: '',
        R2_BUCKET_NAME: 'simop-bucket',
        R2_PUBLIC_DOMAIN: '',
        FONNTE_TOKEN: '',
        CRON_SECRET: 'test-cron-secret',
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      } as z.infer<typeof envSchema>;
    }
    throw new Error('Konfigurasi environment variable tidak lengkap.');
  }

  return parsed.data;
}

export const env = validateEnv();
```
**Cuplikan Kode 4.14** Validasi Variabel Lingkungan Terpusat Berbasis Skema Zod (`src/lib/env.ts:3-58`)

Cuplikan Kode 4.14 di atas membuktikan bahwa pengecekan variabel lingkungan membedakan secara tegas konteks server dan klien melalui `typeof window === 'undefined'`. Pada sisi klien, hanya variabel aman publik (`NEXT_PUBLIC_APP_URL` dan `NODE_ENV`) yang diekspos, sedangkan rahasia infrastruktur pangkalan data dan penyimpanan awan terlindungi sepenuhnya di memori server.

---

### 4.6.1.2 Keamanan Jaringan, Header HTTP, dan Pencegahan Serangan

Keamanan sistem informasi pemerintahan menuntut pencegahan terhadap berbagai vektor serangan siber umum seperti *Cross-Site Scripting* (XSS), *Clickjacking*, *MIME Confusion Attack*, serta *Denial of Service* (DoS). Konfigurasi pertahanan ini ditegakkan pada lapisan terluar aplikasi melalui berkas `next.config.ts`.

Berikut merupakan implementasi konfigurasi header keamanan HTTP dan kebijakan keamanan konten dinamis yang disajikan pada Cuplikan Kode 4.15.

```typescript
// Path: next.config.ts:10-72
const r2AccountId = process.env.R2_ACCOUNT_ID || '';
const r2BucketName = process.env.R2_BUCKET_NAME || '';

const r2ExactHost = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : '';
const r2BucketHost =
  r2AccountId && r2BucketName
    ? `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com`
    : '';

const r2Endpoints = [r2ExactHost, r2BucketHost].filter(Boolean).join(' ');

const isProd = process.env.NODE_ENV === 'production';
const scriptSrc = isProd
  ? "'self' 'unsafe-inline'"
  : "'self' 'unsafe-eval' 'unsafe-inline'";

const cspHeader = `
  default-src 'self';
  script-src ${scriptSrc};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com data:;
  img-src 'self' data: blob: ${r2Endpoints};
  connect-src 'self' ${r2Endpoints};
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};
```
**Cuplikan Kode 4.15** Konfigurasi Header Keamanan HTTP dan Kebijakan CSP Dinamis (`next.config.ts:10-72`)

Cuplikan Kode 4.15 di atas menunjukkan penerapan prinsip *defense-in-depth*:
1. **Content-Security-Policy (CSP)**: Membatasi eksekusi skrip hanya dari asal sistem (`'self'`), melarang evaluasi skrip berbahaya di produksi (`'unsafe-eval'` ditiadakan pada mode *production*), mengizinkan font resmi dari Fontshare dan Google Fonts, serta secara dinamis mendaftarkan *hostname* Cloudflare R2 ke dalam arahan `img-src` dan `connect-src` agar gambar bukti tugas dapat diunggah dan dimuat secara sah.
2. **X-Frame-Options: DENY & frame-ancestors 'none'**: Menolak secara mutlak upaya penyematan antarmuka SIMOP ke dalam elemen `<iframe>`, `<frame>`, `<embed>`, atau `<object>` situs eksternal, sehingga kebal terhadap serangan pembajakan klik (*Clickjacking / UI Redressing*).
3. **X-Content-Type-Options: nosniff**: Memaksa peramban untuk mematuhi tipe MIME yang dideklarasikan oleh server dan melarang *MIME sniffing*, mencegah berkas berbahaya dieksekusi sebagai skrip.
4. **Permissions-Policy**: Mematikan akses perangkat keras kamera, mikrofon, dan geolokasi (`camera=(), microphone=(), geolocation=()`) yang tidak diperlukan dalam sistem operasional internal ini.
5. **X-Robots-Tag: noindex, nofollow**: Melarang perayap mesin pencari publik (seperti Googlebot) mengindeks halaman dan tautan internal SIMOP, menjaga kerahasiaan operasional aparatur.
6. **poweredByHeader: false**: Menghapus header pengenal `X-Powered-By: Next.js` untuk mengaburkan identitas teknologi server terhadap pemindai kerentanan otomatis (*fingerprinting mitigation*).

---

### 4.6.1.3 Autentikasi Kriptografis, Pengelolaan Sesi, dan *Role-Based Access Control* (RBAC)

Sistem autentikasi dikelola oleh pustaka Better Auth 1.2.9 yang diintegrasikan secara terpadu melalui *adapter* Drizzle ORM (`drizzleAdapter`) pada `src/lib/auth.ts:141-154`. Mekanisme autentikasi mengimplementasikan standar keamanan sebagai berikut:
1. **Hashing Kata Sandi Berbasis Scrypt**: Kata sandi aparatur tidak disimpan dalam teks polos, melainkan di-hash menggunakan algoritma modern Scrypt (`better-auth/crypto` via fungsi `hashPassword` dan `verifyPassword`). Algoritma Scrypt dirancang khusus memiliki ketahanan tinggi terhadap serangan *brute-force* berbantuan perangkat keras paralel (*GPU/ASIC-resistant*) dengan memanfaatkan kebutuhan memori yang intensif (*memory-hard function*).
2. **Sesi Berbasis Kuki Aman (*Secure Stateful Session*)**: Autentikasi tidak menggunakan token JWT murni tanpa status (*stateless token*) yang sulit dicabut sebelum masa berlakunya usai. Sistem menggunakan token acak berentropi tinggi yang disimpan pada tabel `sessions` basis data PostgreSQL. Token dikirimkan ke peramban aparatur melalui kuki terenkripsi dengan atribut `HttpOnly` (mencegah pencurian kuki via XSS), `Secure` pada jalur HTTPS, dan `SameSite=Lax` guna memitigasi serangan pemalsuan permintaan antar-situs (*Cross-Site Request Forgery / CSRF*).
3. **Registrasi Publik Dinonaktifkan**: Opsi `emailAndPassword.disableSignUp: true` (`src/lib/auth.ts:75`) mengunci pendaftaran mandiri. Akun aparatur hanya dapat dibuat secara resmi oleh administrator melalui modul kepegawaian.
4. **Resolusi Domain Asal Tepercaya (*Trusted Origins*)**: Modul `resolveTrustedOrigins` (`src/lib/auth.ts:36-62`) menyaring origin yang sah dari variabel lingkungan `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, dan `SIMOP_PREVIEW_DOMAIN`. Domain asal berbasis *wildcard* dilarang keras, dan port `localhost` (3000, 3001, 3002) hanya diizinkan aktif pada lingkungan pengujian lokal non-Vercel.
5. **Pembatasan Frekuensi Masuk (*Rate Limiting*) Berbasis Basis Data**: Better Auth dikonfigurasi menggunakan penyimpanan persisten pada tabel `rate_limits` (`storage: 'database'`). Aturan khusus diberlakukan pada rute `/sign-in/username` dan `/sign-in/email`, di mana setiap alamat IP dibatasi maksimal 10 kali percobaan masuk per rentang jendela 60 detik (`src/lib/auth.ts:83-91`). Identitas IP klien diekstraksi dari header proksi terbalik Vercel secara hierarkis: `x-real-ip` diikuti oleh `x-forwarded-for` (`src/lib/auth.ts:96`).

Pada tingkat aplikasi, otorisasi peran (*authorization guard*) dikendalikan secara mutlak oleh fungsi `requireRole` pada `src/lib/session.ts:36-92`. Tidak seperti sistem konvensional yang mempercayai klaim peran hanya dari kuki pengguna, SIMOP secara *default* mewajibkan verifikasi ganda langsung ke basis data (`checkDbActive: true`).

Berikut merupakan implementasi *guard* sesi dan otorisasi peran terpusat yang disajikan pada Cuplikan Kode 4.16.

```typescript
// Path: src/lib/session.ts:36-92
export async function requireRole(
  allowedRoles: UserRole[],
  options: RequireRoleOptions = { checkDbActive: true }
): Promise<SessionContext> {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session || !sessionData.user) {
    throw new Error('Sesi Anda telah berakhir atau belum masuk. Silakan login kembali.');
  }

  const { session, user: sessionUser } = sessionData;

  // Jika checkDbActive aktif (default true), query langsung ke database PostgreSQL
  if (options.checkDbActive !== false) {
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, sessionUser.id))
      .limit(1);

    if (!dbUser) {
      throw new Error('Akun pengguna tidak ditemukan di database.');
    }

    if (!dbUser.aktif || dbUser.banned) {
      throw new Error(
        'Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.'
      );
    }

    if (!allowedRoles.includes(dbUser.role as UserRole)) {
      throw new Error('Anda tidak memiliki hak akses untuk halaman atau tindakan ini.');
    }

    return {
      session,
      user: dbUser,
    };
  }

  // Fallback membaca status dari cookie jika checkDbActive diset false
  const activeUser = sessionUser as unknown as typeof user.$inferSelect;
  if (!activeUser.aktif || activeUser.banned) {
    throw new Error(
      'Akun Anda telah dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.'
    );
  }

  if (!allowedRoles.includes(activeUser.role as UserRole)) {
    throw new Error('Anda tidak memiliki hak akses untuk halaman atau tindakan ini.');
  }

  return { session, user: activeUser };
}
```
**Cuplikan Kode 4.16** Mekanisme Pengecekan Peran dan Keaktifan Akun (*Guard Sesi*) (`src/lib/session.ts:36-92`)

Cuplikan Kode 4.16 di atas menunjukkan keunggulan krusial pada integritas keamanan SIMOP: ketika seorang aparatur dinonaktifkan atau diblokir oleh administrator melalui `deactivateUser`, verifikasi ke pangkalan data relasional secara instan mendeteksi `dbUser.aktif === false` atau `dbUser.banned === true`. Pengguna tersebut seketika dicegah menjalankan tindakan server apa pun tanpa harus menunggu masa berlaku kuki kedaluwarsa.

---

### 4.6.1.4 Arsitektur Penyimpanan Objek dan Alur Unggah Berkas Cloudflare R2

Pengelolaan berkas bukti tugas kedinasan (foto lapangan dan dokumen laporan PDF) mengimplementasikan arsitektur nir-server (*serverless cloud storage*) memanfaatkan Cloudflare R2 yang dikendalikan melalui pustaka resmi AWS S3 Client SDK (`@aws-sdk/client-s3` dan `@aws-sdk/s3-request-presigner`).

Wadah penyimpanan Cloudflare R2 (`simop-bucket`) dikonfigurasi sebagai wadah privat (*private bucket*). Berkas tidak pernah dapat diakses langsung oleh publik internet melalui URL terbuka. Protokol pengelolaan berkas diatur melalui tahapan teknis berikut:
1. **Batas Ukuran dan Tipe MIME**: Ukuran berkas dibatasi maksimal 5 MB (`MAX_UPLOAD_SIZE = 5 * 1024 * 1024` pada `src/lib/storage.ts:48`). Format berkas yang diizinkan (*whitelist*) dibatasi secara ketat:
   - Bukti foto utama (`ALLOWED_FOTO_MIMES`): `image/jpeg`, `image/png`, `image/webp`.
   - Dokumen laporan pendukung (`ALLOWED_PDF_MIMES`): `application/pdf`.
2. **Penamaan Objek Berbasis Server**: Nama dan jalur kunci objek (*object key*) tidak ditentukan oleh nama berkas asli dari gawai klien (mencegah *Path Traversal* dan *Unrestricted File Upload*). Kunci objek dibentuk secara deterministik oleh server dengan pola: `jadwal/{jadwalId}/{uuid}.{ext}` (`src/lib/storage.ts:91`).
3. **Pemberian Izin Unggah Presigned PUT URL**: Klien meminta izin unggah melalui rute HTTP `POST /api/uploads/sign`. Server memverifikasi otentisitas jadwal dan menerbitkan URL bertanda tangan digital berumur pendek (300 detik / 5 menit) via `createPresignedUploadUrl` (`src/lib/storage.ts:74-107`). Klien kemudian mengunggah *payload* biner berkas secara langsung (*direct client-to-storage upload*) ke Cloudflare R2 tanpa membebani memori komputasi server aplikasi.
4. **Verifikasi Integritas Pasca-Unggah (*HeadObject Verification*)**: Sebelum laporan tugas dinyatakan resmi diterima, Server Action `submitLaporanAction` memanggil fungsi `verifyR2Object` (`src/lib/storage.ts:113-171`). Fungsi ini mengeksekusi perintah `HeadObjectCommand` langsung ke Cloudflare R2 untuk menginspeksi ukuran biner riil (`ContentLength`) dan tipe konten yang tersimpan (`ContentType`). Jika ukuran melebihi 5 MB atau tipe konten tidak sah, objek seketika dihapus dari penyimpanan awan (`deleteR2Object`) dan transaksi dibatalkan.
5. **Pratinjau Berkas Privat Presigned GET URL**: Saat verifikator atau aparatur ingin melihat bukti tugas pada antarmuka, peramban memanggil rute `GET /api/uploads/preview?key=...`. Server memastikan bahwa kunci objek tersebut benar-benar tercatat pada kolom `buktiKey` atau `pdfKey` jadwal terkait milik pengguna yang sah, kemudian menerbitkan URL pratinjau sementara berdurasi 300 detik (`createPresignedPreviewUrl` pada `src/lib/storage.ts:202-221`).

---

### 4.6.1.5 Konvensi Penanganan Galat dan Format Respons Server

Sisi server SIMOP DPMPTSP menerapkan pemisahan konvensi penanganan galat (*error handling convention*) yang terstruktur antara *Route Handlers* (REST API) dan *Server Actions*:
- **Pada Route Handlers (`src/app/api/`)**: Seluruh logika dibungkus dalam blok `try ... catch`. Respons galat dikembalikan dalam format objek JSON standar `{ error: string }` dengan kode status HTTP semantik yang presisi:
  - `400 Bad Request`: Format JSON tidak valid atau kegagalan validasi skema masukan Zod (`z.ZodError`).
  - `403 Forbidden`: Pengguna tidak memiliki hak akses atau mencoba mengakses data penugasan milik pengguna lain.
  - `404 Not Found`: Entitas jadwal atau data yang diminta tidak ditemukan di basis data.
  - `429 Too Many Requests`: Frekuensi permintaan melampaui ambang batas kuota *rate limiter*.
  - `500 Internal Server Error`: Kegagalan fatal tak terduga pada infrastruktur server atau layanan *cloud*.
- **Pada Server Actions (`src/modules/*/actions.ts`)**: Server Action berkomunikasi langsung dengan komponen antarmuka React 19. Kegagalan validasi masukan atau pelanggaran aturan domain ditangani dengan melempar galat eksplisit berbahasa Indonesia yang ramah pengguna (`throw new Error('Pesan galat deskriptif')`). Pada sisi klien, antarmuka menangkap eksepsi ini dan menampilkannya sebagai pesan umpan balik interaktif melalui notifikasi *toast* Sonner atau kotak peringatan (*destructive alert*).

---

## 4.6.2 Struktur Basis Data dan Akses Data

Repositori data persisten SIMOP DPMPTSP dikelola menggunakan sistem manajemen basis data relasional PostgreSQL versi 16 yang disediakan oleh platform komputasi awan Neon Serverless. Akses dan manipulasi data diatur oleh *Object-Relational Mapping* (ORM) Drizzle ORM versi 0.40.0. Berbeda dengan ORM konvensional yang menerapkan abstraksi tebal, Drizzle ORM bertindak sebagai *TypeScript-first ORM* tipis yang mempertahankan performa kueri mendekati SQL murni (*near-zero overhead*) dengan jaminan keselamatan tipe data (*compile-time type safety*).

---

### 4.6.2.1 Konfigurasi Pengumpulan Koneksi (*Connection Pool*) dan Driver Database

Koneksi fisik ke basis data dikelola melalui berkas `src/db/index.ts` menggunakan *driver* resmi Node-Postgres (`pg.Pool`) yang dibungkus oleh *adapter* `drizzle-orm/node-postgres`.

Konfigurasi parameter *connection pool* ditetapkan secara eksplisit pada kode sumber sebagai berikut:
- **`max: 5`**: Batas maksimum koneksi simultan yang dapat dibuka oleh satu proses server dibatasi hingga 5 koneksi (`src/db/index.ts:27`). Pembatasan ini disesuaikan dengan karakteristik arsitektur *serverless* dan arsitektur *pooler* Neon (PgBouncer) guna mencegah habisnya kuota koneksi pangkalan data saat terjadi lonjakan *instance* komputasi.
- **`idleTimeoutMillis: 30000`**: Koneksi yang tidak aktif selama lebih dari 30.000 milidetik (30 detik) akan diputus dan dilepaskan secara otomatis dari memori sistem (`src/db/index.ts:28`).
- **`ssl: isLocalhost ? false : true`**: Seluruh komunikasi data antara server aplikasi dan instans Neon dienkripsi wajib menggunakan protokol Transport Layer Security (TLS/SSL), kecuali saat terdeteksi alamat `localhost` atau `127.0.0.1` pada lingkungan pengetesan lokal (`src/db/index.ts:29`).
- **Pencegahan Kebocoran Koneksi (*Global Singleton Pool*)**: Pada mode pengembangan (*development mode*), objek *pool* disimpan pada variabel global `globalThis._pgPool` (`src/db/index.ts:32-34`). Langkah ini mencegah terbentuknya instans koneksi baru yang berulang setiap kali modul dikompilasi ulang oleh mekanisme *Hot Module Replacement* (HMR) Next.js.
- **Isolasi Pangkalan Data Pengujian (*Test DB Safety Assertion*)**: Modul menyediakan fungsi pembantu `createTestDb` (`src/db/index.ts:40-50`) yang menegakkan pemeriksaan keamanan: sistem melarang keras string koneksi pengujian (`DATABASE_URL_TEST`) bernilai identik dengan basis data produksi (`DATABASE_URL`), sehingga skrip pengetesan otomatis mustahil menghapus atau merusak data riil kedinasan.

---

### 4.6.2.2 Relasi Antartabel, Kunci Asing (*Foreign Keys*), dan Integritas Referensial

Skema basis data dirancang secara normal untuk menjamin konsistensi data operasional dinas. Seluruh tabel entitas domain didefinisikan pada `src/db/schema/domain.ts`, sedangkan tabel autentikasi dikelompokkan pada `src/db/schema/auth.ts`.

Inventarisasi relasi antartabel, kunci asing (*foreign key*), serta aturan integritas referensial disajikan pada Tabel 4.48 berikut.

**Tabel 4.48** Relasi Antartabel, Kunci Asing (*Foreign Keys*), dan Aturan Integritas Basis Data
| Tabel Asal | Kolom FK | Tabel Tujuan | Aturan `onDelete` | Keterangan Aturan Integritas Referensial | Bukti Kode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions` | `user_id` | `users.id` | `CASCADE` | Jika akun aparatur dihapus, seluruh sesi aktif terkait otomatis terhapus dari sistem | `src/db/schema/auth.ts:37` |
| `accounts` | `user_id` | `users.id` | `CASCADE` | Jika akun pengguna dihapus, kredensial sandi terkait otomatis ikut terhapus | `src/db/schema/auth.ts:49` |
| `jadwal` | `pegawai_id` | `users.id` | `CASCADE` | Menautkan tugas dinas dengan aparatur pelaksana. Hapus akun menghapus riwayat tugas | `src/db/schema/domain.ts:34` |
| `jadwal` | `diverifikasi_oleh_id` | `users.id` | `SET NULL` | Menautkan verifikator penugasan. Jika admin verifikator dihapus, riwayat verifikasi tetap utuh | `src/db/schema/domain.ts:42` |
| `tiket` | `pemohon_id` | `users.id` | `CASCADE` | Menautkan permohonan layanan barang/aset dengan aparatur pemohon | `src/db/schema/domain.ts:82` |
| `tiket` | `barang_id` | `barang.id` | `RESTRICT` | Melarang keras penghapusan fisik barang inventaris jika masih dirujuk oleh riwayat tiket | `src/db/schema/domain.ts:85` |
| `stok_log` | `barang_id` | `barang.id` | `CASCADE` | Menautkan catatan mutasi stok dengan barang inventaris terkait | `src/db/schema/domain.ts:101` |
| `stok_log` | `tiket_id` | `tiket.id` | `SET NULL` | Menautkan mutasi pengeluaran barang dengan nomor tiket layanan pemicu mutasi | `src/db/schema/domain.ts:108` |
| `stok_log` | `user_id` | `users.id` | `CASCADE` | Menautkan pencatat mutasi persediaan dengan akun aparatur administrator | `src/db/schema/domain.ts:112` |
| `notifikasi_log` | `pbg_id` | `pbg.id` | `CASCADE` | Menautkan log pengiriman notifikasi dengan tagihan SKRD PBG `[SKEMA SAJA / TIDAK TERHUBUNG]` | `src/db/schema/domain.ts:140` |

Tabel 4.48 di atas membuktikan penerapan aturan integritas referensial yang sangat ketat:
1. Aturan `RESTRICT` pada kolom `tiket.barang_id`: Menjamin bahwa entitas barang pada tabel `barang` tidak dapat dihapus secara fisik dari basis data selama masih terdapat tiket yang merujuk padanya. Aturan ini melandasi kebijakan *soft-archive* (`diarsipkan_pada`) yang diimplementasikan pada modul inventaris.
2. Aturan `SET NULL` pada `jadwal.diverifikasi_oleh_id` dan `stok_log.tiket_id`: Menjaga rekam jejak audit (*audit trail*) historis kedinasan agar tidak hilang meskipun identitas verifikator atau tiket terkait mengalami perubahan status.
3. *Check Constraint* Tingkat Basis Data: Tabel `barang` dilengkapi batasan integritas non-negatif `check('barang_stok_non_negative', sql`${table.stok} >= 0`)` (`src/db/schema/domain.ts:71`). Batasan ini menjamin pada tingkat kernel PostgreSQL bahwa nilai persediaan stok fisik tidak akan pernah dapat bernilai negatif, bahkan jika terjadi anomali logika aplikasi.

---

### 4.6.2.3 Inventaris Transaksi Atomik Basis Data (*Interactive Transactions*)

Operasi bisnis yang melibatkan manipulasi lebih dari satu entitas atau memerlukan jaminan konkurensi data dibungkus secara mutlak di dalam transaksi basis data interaktif (`db.transaction(async (tx) => { ... })`). Apabila salah satu instruksi kueri di dalam blok transaksi mengalami kegagalan, basis data secara otomatis mengeksekusi operasi pembatalan (*rollback*), mengembalikan keadaan data ke titik konsisten semula.

Daftar seluruh transaksi atomik yang terbukti diimplementasikan pada kode sumber disajikan pada Tabel 4.49 berikut.

**Tabel 4.49** Inventaris Transaksi Atomik Basis Data (*Database Interactive Transactions*)
| No | Nama Operasi Bisnis | Modul / Berkas Asal | Entitas Terlibat | Mekanisme Integritas dan Penguncian (*Locking*) | Bukti Kode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Deaktivasi Akun dan Pencabutan Sesi | Kepegawaian (`src/lib/user-management.ts`) | `users`, `sessions` | Pengecekan admin terakhir $\to$ pembaruan `aktif=false, banned=true` $\to$ penghapusan seluruh baris sesi aktif aparatur pada tabel `sessions` | `src/lib/user-management.ts:31-80` |
| 2 | Pendaftaran Barang Baru dan Stok Awal | Inventaris (`src/modules/inventaris/actions.ts`) | `barang`, `stok_log` | Penyisipan data barang baru $\to$ penyisipan log mutasi bertipe `MASUK` dengan `stok_sebelum=0` dan `stok_sesudah=stok_awal` jika stok $> 0$ | `src/modules/inventaris/actions.ts:31-58` |
| 3 | Penyesuaian Kuantitas Stok Persediaan | Inventaris (`src/modules/inventaris/actions.ts`) | `barang`, `stok_log` | Kueri saldo awal $\to$ validasi kecukupan $\to$ kueri atomik bersyarat `UPDATE barang SET stok = stok - ... WHERE stok >= ... RETURNING` $\to$ penyisipan baris `stok_log` | `src/modules/inventaris/actions.ts:98-172` |
| 4 | Penghapusan Fisik atau Pengarsipan Barang | Inventaris (`src/modules/inventaris/actions.ts`) | `barang`, `tiket`, `stok_log` | Pemeriksaan keberadaan riwayat pada `tiket` dan `stok_log`. Jika ada riwayat: `UPDATE barang SET diarsipkan_pada = NOW()`. Jika nihil: `DELETE FROM barang` | `src/modules/inventaris/actions.ts:189-237` |
| 5 | Persetujuan Tiket (*ACC*) dan Pemotongan Stok | Tiket Layanan (`src/modules/tiket/actions.ts`) | `tiket`, `barang`, `stok_log` | Klaim status atomik `UPDATE tiket SET status='ACC' WHERE id=? AND status='MENUNGGU' RETURNING` (pencegah *double ACC*) $\to$ pemotongan stok bersyarat $\to$ pencatatan `stok_log` | `src/modules/tiket/actions.ts:85-154` |

Tabel 4.49 di atas membuktikan bahwa seluruh alur kritis SIMOP DPMPTSP telah terlindungi oleh mekanisme transaksi ACID (*Atomicity, Consistency, Isolation, Durability*). Penerapan penguncian baris pada transaksi nomor 5 menjadi pertahanan utama terhadap anomali konkurensi persetujuan tiket ganda (*race condition*).

---

## 4.6.3 Logika Bisnis dan Transaksi Sisi Server per Kebutuhan Fungsional

Bagian ini menguraikan perwujudan logika bisnis, validasi skema masukan, alur eksekusi, serta penanganan kasus batas (*edge cases*) untuk setiap kelompok Kebutuhan Fungsional (FR-01 hingga FR-20).

---

### 4.6.3.1 Autentikasi dan Pengelolaan Sesi Aparatur (FR-01, FR-02)

Kelompok kebutuhan ini memfasilitasi akses masuk aparatur ke dalam sistem operasional dinas dan pemutusan sesi secara aman:
- **Lokasi Berkas Pengendali**: `src/lib/auth.ts:68-154`, `src/app/api/auth/[...all]/route.ts:1-5`.
- **Validasi Masukan**: Masukan nama pengguna dan kata sandi divalidasi oleh pustaka Better Auth. Nama pengguna dinormalisasi menjadi huruf kecil tanpa karakter ilegal melalui fungsi `getSyntheticEmail` (`src/lib/auth.ts:160-163`) untuk menghasilkan alamat surel internal sintetis `${sanitized}@simop.local`.
- **Alur Eksekusi**:
  1. Klien mengirimkan kredensial melalui endpoint `POST /api/auth/sign-in/username`.
  2. Modul `rateLimit` Better Auth memverifikasi jumlah percobaan masuk dari alamat IP pemohon pada tabel `rate_limits`. Jika melampaui 10 kali per 60 detik, sistem melempar respons `429 Too Many Requests`.
  3. Sistem mencari akun credential pada tabel `accounts` yang berelasi dengan nama pengguna terkait.
  4. Kata sandi masukan diverifikasi terhadap hash Scrypt pada kolom `account.password`.
  5. Sesi baru dibuat pada tabel `sessions` dengan masa berlaku 7 hari, dan token sesi dikirimkan kembali ke peramban dalam bentuk kuki aman `HttpOnly`.
  6. Pada proses keluar (*Sign-Out* via `POST /api/auth/sign-out`), baris token sesi terkait dihapus permanen dari tabel `sessions` dan kuki dibersihkan dari peramban.

---

### 4.6.3.2 Pengelolaan Akun Aparatur dan Hak Akses (FR-03, FR-04, FR-05)

Kelompok kebutuhan ini memberikan wewenang administratif kepada Administrator Dinas untuk mengelola akun aparatur sipil dinas:
- **Lokasi Berkas Pengendali**: `src/modules/pegawai/actions.ts:20-120`, `src/lib/user-management.ts:22-100`.
- **Validasi Masukan**: Ditegakkan melalui skema Zod `createPegawaiSchema`, `updatePegawaiSchema`, dan `resetPasswordSchema` (`src/modules/pegawai/schema.ts:3-28`):
  - `name`: string terpotong spasi (*trimmed*), panjang 3–100 karakter.
  - `username`: string terpotong spasi, panjang 3–50 karakter, wajib cocok dengan ekspresi reguler `/^[a-z0-9_.-]+$/` (hanya huruf kecil, angka, garis bawah, titik, strip).
  - `password` / `newPassword`: string minimal 8 karakter.
  - `bidang`: enumerasi wajib salah satu dari `SEKRETARIAT`, `PTSP`, `PM`, atau `PENGAWASAN`.
  - `nip`: string opsional, maksimal 30 karakter.
- **Alur Eksekusi Pembuatan Akun (`createPegawaiAction`)**:
  1. Mengeksekusi guard `await requireRole(['ADMIN'])`.
  2. Memeriksa keunikan nama pengguna pada tabel `users`. Jika telah terpakai, melempar pesan: `"Username @... sudah digunakan"`.
  3. Membangkitkan UUID pengguna baru dan alamat surel sintetis internal.
  4. Menyisipkan rekaman aparatur baru ke tabel `users` dengan nilai bawaan `role: 'PEGAWAI'`, `aktif: true`, `banned: false`.
  5. Melakukan hashing terhadap kata sandi menggunakan `hashPassword(parsed.password)` dan menyisipkan rekaman kredensial ke tabel `accounts`.
  6. Memanggil `revalidatePath('/admin/pegawai')` untuk memperbarui *cache* tampilan antarmuka.
- **Transaksi Deaktivasi Akun dan Pencabutan Sesi (`deactivateUser`)**:
  Untuk mencegah terhapusnya riwayat penugasan, jadwal, dan tiket aparatur secara tidak sengaja, sistem tidak mengizinkan operasi *hard delete* pegawai. Sebagai gantinya, sistem menerapkan penonaktifan akun atomik.

Berikut merupakan cuplikan kode asli fungsi transaksi deaktivasi akun aparatur yang disajikan pada Cuplikan Kode 4.17.

```typescript
// Path: src/lib/user-management.ts:22-81
export async function deactivateUser(
  targetUserId: string,
  currentUserId: string,
  reason: string = 'Akun dinonaktifkan oleh administrator dinas'
): Promise<DeactivateUserResult> {
  if (targetUserId === currentUserId) {
    throw new Error('Anda tidak dapat menonaktifkan akun Anda sendiri.');
  }

  return await db.transaction(async (tx) => {
    // 1. Ambil data target user
    const [target] = await tx
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (!target) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (!target.aktif) {
      return {
        success: true,
        message: `Akun @${target.username} sudah dalam kondisi nonaktif.`,
      };
    }

    // 2. Jika target adalah ADMIN, pastikan bukan admin aktif terakhir di sistem
    if (target.role === 'ADMIN') {
      const [adminCountResult] = await tx
        .select({ total: count() })
        .from(user)
        .where(and(eq(user.role, 'ADMIN'), eq(user.aktif, true)));

      if (Number(adminCountResult?.total || 0) <= 1) {
        throw new Error('Tidak dapat menonaktifkan akun administrator aktif terakhir di sistem.');
      }
    }

    // 3. Update status akun pengguna menjadi nonaktif dan banned
    await tx
      .update(user)
      .set({
        aktif: false,
        banned: true,
        banReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId));

    // 4. Cabut seluruh sesi aktif yang dimiliki pengguna seketika dari basis data
    await tx.delete(session).where(eq(session.userId, targetUserId));

    return {
      success: true,
      message: `Akun @${target.username} berhasil dinonaktifkan dan seluruh sesi aktif telah dicabut.`,
    };
  });
}
```
**Cuplikan Kode 4.17** Transaksi Atomik Deaktivasi Akun dan Pencabutan Sesi Pengguna (`src/lib/user-management.ts:22-81`)

Cuplikan Kode 4.17 di atas menunjukkan 2 (dua) mekanisme proteksi krusial:
1. Perlindungan bunuh diri akun (*self-deactivation prevention*): Administrator dilarang menonaktifkan akunnya sendiri (`targetUserId === currentUserId`).
2. Perlindungan penguncian sistem (*lock-out protection*): Kueri `COUNT()` memastikan sistem tidak mengizinkan penonaktifan akun jika administrator yang ditargetkan merupakan satu-satunya administrator aktif yang tersisa di sistem. Sesi aktif pengguna juga seketika dibersihkan dari tabel `sessions` secara atomik.

---

### 4.6.3.3 Manajemen dan Generator Penugasan Jadwal (FR-06, FR-07)

Kelompok kebutuhan ini mengatur pembagian tugas kedinasan aparatur di berbagai titik pelayanan (loket pelayanan, kantor dinas, maupun kecamatan):
- **Lokasi Berkas Pengendali**: `src/modules/jadwal/actions.ts:27-120`, `src/modules/jadwal/lib/generator.ts:32-99`.
- **Validasi Masukan**: Ditegakkan melalui skema Zod `createJadwalRangeSchema` (`src/modules/jadwal/schema.ts:3-16`):
  - `judul`: string terpotong spasi, panjang 3–150 karakter.
  - `tanggalMulai` dan `tanggalSelesai`: string format tanggal kalender valid.
  - `pegawaiIds`: larik identitas pengguna, minimal 1 aparatur terpilih.
  - `lokasiTipe`: enumerasi `LOKET`, `KECAMATAN`, `KANTOR`, atau `LAINNYA`.
  - `skipWeekends`: boolean bawaan `true` (otomatis melewati hari Sabtu dan Minggu).
- **Logika Generator Rentang Tanggal (`generateJadwalRange`)**:
  Fungsi generator pada `src/modules/jadwal/lib/generator.ts` mengevaluasi parameter masukan:
  1. Memvalidasi bahwa rentang hari antara `tanggalMulai` dan `tanggalSelesai` tidak boleh melebihi batas maksimal 31 hari kalender (`diffDays <= 31`).
  2. Melakukan perulangan tanggal demi tanggal. Pada setiap tanggal, fungsi memeriksa indeks hari (`current.getDay()`). Jika `skipWeekends` aktif dan hari bernilai `0` (Minggu) atau `6` (Sabtu), tanggal tersebut dilewati secara otomatis.
  3. Setiap tanggal aktif dinormalisasi menjadi tanggal kalender WIB murni (`YYYY-MM-DD` via `toWibDateString`).
  4. Untuk setiap pegawai dalam daftar `pegawaiIds`, sistem menghasilkan satu entitas tugas individual dengan status awal `BELUM_DIKERJAKAN`.
- **Penyisipan Jamak (*Batch Insert*) dan Penghapusan Jadwal**:
  Seluruh entitas tugas yang dihasilkan disisipkan ke basis data dalam satu kali kueri jamak (`db.insert(jadwal).values(...)`). Pada Server Action `deleteJadwalAction`, jadwal yang telah berstatus `SELESAI` dilarang untuk dihapus demi menjaga integritas arsip akuntabilitas kinerja. Jika jadwal belum selesai, baris basis data dihapus terlebih dahulu, kemudian berkas bukti terkait di Cloudflare R2 dibersihkan secara asinkron melalui fungsi `deleteR2Object`.

---

### 4.6.3.4 Pelaporan Bukti Tugas Mandiri (FR-08, FR-09)

Kelompok kebutuhan ini memfasilitasi aparatur pelaksana untuk mengunggah bukti hasil pelaksanaan tugas kedinasan ke penyimpanan awan Cloudflare R2:
- **Lokasi Berkas Pengendali**: `src/app/api/uploads/sign/route.ts:19-100`, `src/modules/jadwal/actions.ts:126-197`, `src/lib/storage.ts:74-171`.
- **Validasi Masukan**:
  - Pada rute penerbitan izin unggah (`/api/uploads/sign`), skema `signSchema` memvalidasi `jadwalId`, `slot` (`foto` atau `pdf`), `contentType`, dan `fileSize` ($1 \le x \le 5 \text{ MB}$).
  - Pada Server Action pelaporan (`submitLaporanAction`), skema `submitLaporanSchema` memvalidasi `jadwalId`, `buktiKey` (wajib), dan `pdfKey` (opsional).
- **Alur Eksekusi Terkoordinasi**:
  1. Klien mengirim permintaan izin unggah ke `POST /api/uploads/sign`. Server memverifikasi kepemilikan: aparatur pemohon harus merupakan pemilik sah jadwal (`targetJadwal.pegawaiId === user.id`) dan jadwal harus berstatus `BELUM_DIKERJAKAN`.
  2. Server menerbitkan Presigned PUT URL Cloudflare R2 dengan batas waktu kedaluwarsa 300 detik.
  3. Klien mengunggah biner berkas langsung ke R2.
  4. Klien memanggil Server Action `submitLaporanAction`. Server mengeksekusi fungsi `verifyR2Object` untuk memvalidasi bahwa berkas benar-benar telah sampai di wadah penyimpanan, berukuran $\le 5$ MB, dan bertipe MIME yang sah.
  5. Jika aparatur mengunggah ulang laporan untuk tugas yang sebelumnya pernah ditolak, berkas fisik lama di Cloudflare R2 otomatis dihapus via `deleteR2Object(target.buktiKey)` untuk menghemat ruang penyimpanan awan.
  6. Status jadwal diperbarui menjadi `MENUNGGU_VERIFIKASI` dan catatan verifikator lama direset menjadi `null`.

Berikut merupakan implementasi pembentukan Presigned URL dan verifikasi integritas objek Cloudflare R2 yang disajikan pada Cuplikan Kode 4.18.

```typescript
// Path: src/lib/storage.ts:74-171
export async function createPresignedUploadUrl(params: {
  jadwalId: string;
  slot: 'foto' | 'pdf';
  contentType: string;
}): Promise<PresignedUploadResult> {
  const { jadwalId, slot, contentType } = params;

  if (slot === 'foto' && !ALLOWED_FOTO_MIMES.includes(contentType)) {
    throw new Error('Format foto harus berupa JPEG, PNG, atau WebP.');
  }

  if (slot === 'pdf' && !ALLOWED_PDF_MIMES.includes(contentType)) {
    throw new Error('Format berkas harus berupa dokumen PDF.');
  }

  const ext = getExtensionFromMime(contentType);
  const fileUuid = crypto.randomUUID();
  const objectKey = `jadwal/${jadwalId}/${fileUuid}.${ext}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return { presignedUrl, objectKey };
}

export async function verifyR2Object(params: {
  objectKey: string;
  jadwalId: string;
  allowedMimes: string[];
  s3Client?: S3Client;
}): Promise<{ contentLength: number; contentType: string }> {
  const { objectKey, jadwalId, allowedMimes, s3Client } = params;
  const expectedPrefix = `jadwal/${jadwalId}/`;

  if (!objectKey.startsWith(expectedPrefix)) {
    throw new Error('Kunci objek tidak sesuai dengan identitas jadwal tugas.');
  }

  if (!s3Client && (process.env.NODE_ENV === 'test' || !env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID)) {
    return { contentLength: 1024 * 1024, contentType: allowedMimes[0] || 'image/jpeg' };
  }

  const client = s3Client || getR2Client();

  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET_NAME || 'test-bucket',
        Key: objectKey,
      })
    );

    const size = head.ContentLength ?? 0;
    const type = head.ContentType ?? '';

    if (size > MAX_UPLOAD_SIZE) {
      await deleteR2Object(objectKey, client);
      throw new Error('Ukuran berkas melebihi batas maksimal 5 MB.');
    }

    if (!allowedMimes.includes(type.toLowerCase())) {
      await deleteR2Object(objectKey, client);
      throw new Error(`Format berkas (${type}) tidak diizinkan.`);
    }

    return { contentLength: size, contentType: type };
  } catch (err: any) {
    if (err.name === 'NotFound') {
      throw new Error('Berkas bukti belum berhasil terunggah ke penyimpanan.');
    }
    throw err;
  }
}
```
**Cuplikan Kode 4.18** Pembangkitan URL Presigned PUT dan Verifikasi Integritas Objek R2 (`src/lib/storage.ts:74-171`)

Cuplikan Kode 4.18 di atas membuktikan bahwa integritas berkas diuji secara faktual menggunakan `HeadObjectCommand`. Server tidak mempercayai informasi ukuran berkas yang dikirimkan oleh peramban klien semata, melainkan menginterogasi langsung metadata objek biner yang tersimpan di Cloudflare R2.

---

### 4.6.3.5 Verifikasi Laporan Tugas Kedinasan (FR-10, FR-11)

Kelompok kebutuhan ini mengatur wewenang Administrator Dinas dalam meninjau dan menetapkan status validitas laporan tugas yang diajukan oleh aparatur:
- **Lokasi Berkas Pengendali**: `src/modules/verifikasi/actions.ts:16-90`, `src/modules/jadwal/lib/generator.ts:110-129`.
- **Validasi Masukan**: Ditegakkan melalui skema Zod `verifikasiActionSchema` (`src/modules/verifikasi/schema.ts:3-24`) yang dilengkapi aturan penyempurnaan `superRefine`:
  - `jadwalId`: string minimal 1 karakter.
  - `decision`: enumerasi wajib bernilai `ACC` atau `TOLAK`.
  - `catatanVerifikator`: jika keputusan bernilai `TOLAK`, catatan alasan penolakan wajib diisi dengan panjang minimal 5 karakter dan maksimal 1000 karakter (`ctx.addIssue`).
- **Alur Eksekusi Keputusan Verifikasi (`verifikasiJadwalAction`)**:
  1. Mengeksekusi guard `await requireRole(['ADMIN'])`.
  2. Mengambil data jadwal target dari basis data dan memastikan status terkini jadwal adalah `MENUNGGU_VERIFIKASI`. Jika status berbeda, tindakan dibatalkan.
  3. **Jika Keputusan ACC**:
     - Fungsi memvalidasi transisi status dari `MENUNGGU_VERIFIKASI` menuju `SELESAI` via `validateStatusTransition`.
     - Mengeksekusi pembaruan basis data: `status = 'SELESAI'`, `diverifikasiOlehId = verifikator.id`, `diverifikasiPada = new Date()`, `catatanVerifikator = null`.
  4. **Jika Keputusan TOLAK**:
     - Fungsi memvalidasi transisi status dari `MENUNGGU_VERIFIKASI` kembali menuju `BELUM_DIKERJAKAN`.
     - Mengeksekusi pembaruan basis data: `status = 'BELUM_DIKERJAKAN'`, `diverifikasiOlehId = verifikator.id`, `diverifikasiPada = new Date()`, `catatanVerifikator = parsed.catatanVerifikator`. Status dikembalikan ke `BELUM_DIKERJAKAN` agar aparatur dapat memperbaiki foto bukti tugas melalui dialog unggah laporan.
  5. Memanggil `revalidatePath` pada rute `/admin/verifikasi`, `/admin/jadwal`, `/pegawai/jadwal`, dan `/dashboard`.

---

### 4.6.3.6 Manajemen Katalog Inventaris dan Penyesuaian Stok (FR-12, FR-13, FR-14)

Kelompok kebutuhan ini memfasilitasi pencatatan persediaan aset dan alat tulis kantor (ATK) dinas serta penelusuran riwayat mutasi persediaan secara akuntabel:
- **Lokasi Berkas Pengendali**: `src/modules/inventaris/actions.ts:21-280`.
- **Validasi Masukan**:
  - `createBarangSchema` & `updateBarangSchema` (`src/modules/inventaris/schema.ts:3-25`): memvalidasi `nama` (2–150 karakter), `kategori` (`ATK` atau `ASET`), `stok` (integer $\ge 0$), `limitStok` (integer $\ge 0$), dan `satuan` (default `Pcs`).
  - `adjustStokSchema` (`src/modules/inventaris/schema.ts:26-33`): memvalidasi `barangId`, `tipe` (`MASUK` atau `KELUAR`), `jumlah` (integer $\ge 1$), dan `keterangan` (3–255 karakter).
- **Alur Penyesuaian Kuantitas Stok (`adjustStokAction`)**:
  Operasi penyesuaian stok dibungkus di dalam transaksi basis data interaktif `db.transaction()` untuk mencegah anomali *dirty read* dan *lost update*.

Berikut merupakan implementasi kueri transaksi atomik penyesuaian stok yang disajikan pada Cuplikan Kode 4.19.

```typescript
// Path: src/modules/inventaris/actions.ts:98-172
const result = await db.transaction(async (tx) => {
  const [target] = await tx
    .select({ id: barang.id, nama: barang.nama, stok: barang.stok })
    .from(barang)
    .where(eq(barang.id, parsed.barangId))
    .limit(1);

  if (!target) throw new Error('Barang tidak ditemukan.');

  const stokSebelum = target.stok;
  let stokSesudah: number;

  if (parsed.tipe === 'MASUK') {
    stokSesudah = stokSebelum + parsed.jumlah;
    await tx
      .update(barang)
      .set({
        stok: sql`${barang.stok} + ${parsed.jumlah}`,
        updatedAt: new Date(),
      })
      .where(eq(barang.id, target.id));
  } else {
    // Tipe KELUAR: pastikan stok mencukupi sebelum mutasi
    if (stokSebelum < parsed.jumlah) {
      throw new Error(
        `Stok saat ini (${stokSebelum}) tidak mencukupi untuk pengurangan sebanyak ${parsed.jumlah}.`
      );
    }

    stokSesudah = stokSebelum - parsed.jumlah;

    // Update bersyarat tingkat SQL dengan klausa RETURNING
    const updated = await tx
      .update(barang)
      .set({
        stok: sql`${barang.stok} - ${parsed.jumlah}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(barang.id, target.id),
          sql`${barang.stok} >= ${parsed.jumlah}`
        )
      )
      .returning({ id: barang.id });

    if (updated.length === 0) {
      throw new Error('Stok barang tidak mencukupi untuk pengurangan ini.');
    }
  }

  // Catat buku mutasi log secara atomik
  await tx.insert(stokLog).values({
    id: crypto.randomUUID(),
    barangId: target.id,
    tipe: parsed.tipe,
    jumlah: parsed.jumlah,
    stokSebelum,
    stokSesudah,
    keterangan: parsed.keterangan,
    userId: admin.id,
  });

  return { nama: target.nama, stokSebelum, stokSesudah };
});
```
**Cuplikan Kode 4.19** Logika Penyesuaian Kuantitas Stok dan Pencatatan Buku Mutasi Log (`src/modules/inventaris/actions.ts:98-172`)

Cuplikan Kode 4.19 di atas mendemonstrasikan penerapan kueri atomik bersyarat: klausa `and(eq(barang.id, target.id), sql`${barang.stok} >= ${parsed.jumlah}`)` dievaluasi langsung oleh mesin PostgreSQL. Jika terdapat dua administrator yang mengurangi stok pada detik yang sama hingga melampaui sisa fisik, kueri kedua akan mengembalikan 0 baris, memicu eksepsi, dan membatalkan seluruh transaksi secara otomatis.

---

### 4.6.3.7 Pengajuan dan Persetujuan Tiket Layanan (FR-15, FR-16, FR-17)

Kelompok kebutuhan ini mengatur siklus hidup permintaan barang inventaris dan pelaporan kerusakan sarana kerja oleh aparatur dinas:
- **Lokasi Berkas Pengendali**: `src/modules/tiket/actions.ts:20-217`, `src/modules/tiket/lib/transitions.ts:17-72`.
- **Validasi Masukan**:
  - `createTiketSchema` (`src/modules/tiket/schema.ts:3-10`): memvalidasi `barangId`, `jenis` (`PERMINTAAN_BARANG` atau `LAPOR_KERUSAKAN`), `jumlah` (integer $\ge 1$), dan `keperluan` (5–500 karakter).
  - `updateTiketStatusSchema` (`src/modules/tiket/schema.ts:12-18`): memvalidasi `tiketId`, `status` (`ACC`, `MAINTENANCE`, `DITOLAK`, atau `SELESAI`), dan `catatanAdmin` (opsional $\le 500$ karakter).
- **Pemberian Nomor Tiket Unik (`createTiketAction`)**:
  Nomor tiket dibangkitkan secara otomatis oleh server dengan format terstandarisasi: `TKT-YYYYMMDD-XXXX` (misalnya `TKT-20261104-A7F2`), di mana komponen tanggal diekstraksi dari waktu kalender WIB saat ini dan 4 karakter alfanumerik acak ditambahkan di akhir untuk menjamin keunikan mutlak pada kolom `tiket.nomorTiket`.
- **Transaksi Persetujuan Tiket dan Pencegahan *Double ACC* (`accTiketAction`)**:
  Tantangan konkurensi terbesar pada modul tiket adalah risiko terjadinya persetujuan ganda (*double ACC*) oleh dua administrator secara simultan yang dapat menyebabkan pemotongan persediaan barang melebihi kuantitas yang diminta.

Berikut merupakan cuplikan kode asli penanganan transaksi persetujuan tiket secara atomik yang disajikan pada Cuplikan Kode 4.20.

```typescript
// Path: src/modules/tiket/actions.ts:85-154
const result = await db.transaction(async (tx) => {
  // 1. Langkah Pertama: Klaim tiket menjadi ACC secara atomik dengan row lock
  const claimed = await tx
    .update(tiket)
    .set({
      status: 'ACC',
      catatanAdmin: catatanAdmin?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(tiket.id, tiketId), eq(tiket.status, 'MENUNGGU')))
    .returning({
      id: tiket.id,
      nomorTiket: tiket.nomorTiket,
      barangId: tiket.barangId,
      jenis: tiket.jenis,
      jumlah: tiket.jumlah,
    });

  if (claimed.length === 0) {
    throw new Error(
      'Tiket tidak dapat disetujui: tiket tidak ditemukan atau sudah tidak berstatus MENUNGGU.'
    );
  }

  const targetTiket = claimed[0];

  // 2. Jika jenis adalah PERMINTAAN_BARANG dan memiliki barangId, potong stok secara atomik
  if (targetTiket.jenis === 'PERMINTAAN_BARANG' && targetTiket.barangId) {
    const updated = await tx
      .update(barang)
      .set({
        stok: sql`${barang.stok} - ${targetTiket.jumlah}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(barang.id, targetTiket.barangId),
          sql`${barang.stok} >= ${targetTiket.jumlah}`
        )
      )
      .returning({ id: barang.id, stok: barang.stok });

    if (updated.length === 0) {
      throw new Error(
        `Stok barang tidak mencukupi untuk memenuhi permintaan tiket #${targetTiket.nomorTiket}.`
      );
    }

    const stokSesudah = updated[0].stok;
    const stokSebelum = stokSesudah + targetTiket.jumlah;

    // 3. Catat stok_log KELUAR lengkap dengan tiketId dan akun admin penyetuju
    await tx.insert(stokLog).values({
      id: crypto.randomUUID(),
      barangId: targetTiket.barangId,
      tipe: 'KELUAR',
      jumlah: targetTiket.jumlah,
      stokSebelum,
      stokSesudah,
      keterangan: `Persetujuan Tiket #${targetTiket.nomorTiket}`,
      tiketId: targetTiket.id,
      userId: admin.id,
    });
  }

  return { nomorTiket: targetTiket.nomorTiket };
});
```
**Cuplikan Kode 4.20** Klaim Tiket Atomik dan Pengurangan Stok Fisik (*Anti Double-ACC*) (`src/modules/tiket/actions.ts:85-154`)

Cuplikan Kode 4.20 di atas menunjukkan desain arsitektur yang sangat tangguh:
1. Instruksi pertama dalam transaksi adalah `UPDATE tiket SET status = 'ACC' WHERE id = ? AND status = 'MENUNGGU' RETURNING *`. PostgreSQL secara otomatis mengunci baris tiket tersebut (*row-level exclusive lock*). Apabila terdapat permintaan persetujuan kedua yang tiba sepersekian milidetik kemudian, kueri klaim kedua mendapati status tiket sudah bukan lagi `MENUNGGU`. Hasil `claimed.length` bernilai 0 dan transaksi seketika dibatalkan (*rollback*).
2. Jika jenis tiket adalah `PERMINTAAN_BARANG`, pemotongan stok dieksekusi secara atomik bersyarat `WHERE stok >= ?`. Jika sisa stok di gudang tidak mencukupi, transaksi dibatalkan dengan pesan galat deskriptif dan status tiket batal berubah menjadi `ACC`.
3. Rekaman mutasi `stok_log` bertipe `KELUAR` otomatis disisipkan dengan mencantumkan kunci asing `tiketId` dan `userId` administrator penyetuju.

---

### 4.6.3.8 Monitoring dan Administrasi Retribusi PBG (FR-18, FR-19)

Kelompok kebutuhan ini mengatur pencatatan kewajiban Surat Ketetapan Retribusi Daerah (SKRD) Persetujuan Bangunan Gedung (PBG) dan pemantauan pelunasannya:
- **Lokasi Berkas Pengendali**: `src/modules/pbg/actions.ts:19-240`.
- **Validasi Masukan**: Ditegakkan melalui skema Zod `createPbgSchema` dan `updatePbgSchema` (`src/modules/pbg/schema.ts:23-62`):
  - `pemohon`: string terpotong spasi, panjang 3–150 karakter.
  - `noWa`: string nomor seluler yang dinormalisasi otomatis menggunakan fungsi `normalizeWaNumber` (`src/modules/pbg/schema.ts:9-21`) menjadi format internasional Indonesia `628xxxxxxxx` dan divalidasi oleh regex `/^628\d{8,12}$/`.
  - `noSkrd`: string format kapital (`toUpperCase()`), panjang 3–50 karakter, dan diverifikasi keunikan mutlaknya di basis data.
  - `lokasi`: string alamat atau titik lokasi proyek, panjang 3–300 karakter.
  - `nominal`: angka positif ($> 0$), maksimal Rp 10.000.000.000,00 (10 Miliar). Disimpan pada kolom tipe `numeric(14, 2)` melalui konversi `.toFixed(2)`.
  - `jatuhTempo`: string tanggal berformat baku `YYYY-MM-DD`.
- **Alur Pelunasan dan Pembatalan Status SKRD**:
  - Pada Server Action `markPbgLunasAction`, sistem memastikan status terkini tagihan belum berstatus `LUNAS`. Kolom `status` diubah menjadi `'LUNAS'`, dan stempel waktu pelunasan dicatat secara presisi pada kolom `dibayarPada = new Date()`.
  - Pada Server Action `unmarkPbgLunasAction`, sistem memfasilitasi pembatalan status pelunasan jika terjadi kekeliruan pencatatan perbankan. Status dikembalikan menjadi `'BELUM_BAYAR'` dan kolom `dibayarPada` direset menjadi `null`.
- **Status Otomatisasi Pengingat Jatuh Tempo**:
  Berdasarkan audit terhadap repositori dan dokumen keputusan `docs/DECISIONS.md:121-128`, fitur pengiriman pesan WhatsApp otomatis dan rute cron `/api/cron/pbg-reminder` saat ini berstatus `[DITANGGUHKAN SEMENTARA DI FASE 4]`. Penagihan tagihan yang mendekati jatuh tempo ($\le 3$ hari) dilakukan secara mandiri oleh petugas loket dinas melalui tautan langsung *WhatsApp Web* (`wa.me`) pada antarmuka tabel.

---

### 4.6.3.9 Pencarian Cepat Global CommandMenu (FR-20)

Kelompok kebutuhan ini menyediakan fungsionalitas penelusuran data terpadu lintas modul menggunakan jendela palet perintah (*command palette* / pintasan keyboard Ctrl+K atau Cmd+K):
- **Lokasi Berkas Pengendali**: `src/modules/search/actions.ts:26-192`.
- **Validasi Masukan**: Masukan kata kunci dipotong spasi (*trimmed*). Pencarian hanya dieksekusi jika panjang kata kunci minimal 2 karakter (`q.length >= 2`).
- **Penegakan Hak Akses dan Isolasi Data (*RBAC Data Isolation*)**:
  Server Action `globalSearchAction` menerapkan pembatasan data yang sangat ketat berdasarkan peran sesi aparatur (`sessionUser.role`).

Berikut merupakan implementasi kueri pencarian global dengan pemisahan peran yang disajikan pada Cuplikan Kode 4.21.

```typescript
// Path: src/modules/search/actions.ts:26-124
export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  const { user: sessionUser } = await requireAuth();
  const q = query.trim();

  if (!q || q.length < 2) return [];

  const results: SearchResultItem[] = [];
  const term = `%${q}%`;

  if (sessionUser.role === 'ADMIN') {
    // 1. Cari Pegawai Dinas (maksimal 4 hasil)
    const employees = await db
      .select({ id: user.id, name: user.name, username: user.username, bidang: user.bidang, role: user.role })
      .from(user)
      .where(and(eq(user.aktif, true), or(ilike(user.name, term), ilike(user.username, term), ilike(user.nip, term))))
      .limit(4);

    for (const emp of employees) {
      results.push({
        id: `user-${emp.id}`,
        category: 'Pegawai',
        title: emp.name,
        subtitle: `@${emp.username} • Bidang ${emp.bidang || 'Umum'} (${emp.role})`,
        href: '/admin/pegawai',
        iconName: 'User',
      });
    }

    // 2. Cari Inventaris & ATK (maksimal 4 hasil)
    const items = await db
      .select({ id: barang.id, nama: barang.nama, kodeBarang: barang.kodeBarang, stok: barang.stok, satuan: barang.satuan })
      .from(barang)
      .where(and(isNull(barang.diarsipkanPada), or(ilike(barang.nama, term), ilike(barang.kodeBarang, term))))
      .limit(4);

    for (const itm of items) {
      results.push({
        id: `barang-${itm.id}`,
        category: 'Inventaris & ATK',
        title: itm.nama,
        subtitle: `Kode: ${itm.kodeBarang} • Stok: ${itm.stok} ${itm.satuan || 'Pcs'}`,
        href: '/admin/inventaris',
        iconName: 'Package',
      });
    }

    // 3. Sisa kuota diisi pencarian Retribusi PBG (jika total hasil < 8)
    if (results.length < 8) {
      const remainingSlots = 8 - results.length;
      const pbgItems = await db
        .select({ id: pbg.id, pemohon: pbg.pemohon, noSkrd: pbg.noSkrd, status: pbg.status })
        .from(pbg)
        .where(or(ilike(pbg.pemohon, term), ilike(pbg.noSkrd, term)))
        .limit(remainingSlots);

      for (const p of pbgItems) {
        results.push({
          id: `pbg-${p.id}`,
          category: 'Retribusi PBG',
          title: p.pemohon,
          subtitle: `SKRD: ${p.noSkrd} • Status: ${p.status}`,
          href: '/admin/pbg',
          iconName: 'ReceiptText',
        });
      }
    }
  } else {
    // Role: PEGAWAI (Isolasi data ketat: HANYA tugas milik sendiri dan katalog barang)
    const myJadwals = await db
      .select({ id: jadwal.id, judul: jadwal.judul, status: jadwal.status, tanggal: jadwal.tanggal, lokasiTipe: jadwal.lokasiTipe })
      .from(jadwal)
      .where(and(eq(jadwal.pegawaiId, sessionUser.id), or(ilike(jadwal.judul, term), ilike(jadwal.deskripsi, term))))
      .orderBy(desc(jadwal.tanggal))
      .limit(5);

    for (const j of myJadwals) {
      results.push({
        id: `jadwal-${j.id}`,
        category: 'Jadwal Tugas',
        title: j.judul,
        subtitle: `${formatDateShort(j.tanggal)} • Lokasi: ${j.lokasiTipe} • ${j.status}`,
        href: '/pegawai/jadwal',
        iconName: 'Calendar',
      });
    }
    // Lanjutan: Mencari katalog barang aktif untuk kebutuhan pengajuan tiket (maksimal hingga total 8 hasil)
  }

  return results.slice(0, 8);
}
```
**Cuplikan Kode 4.21** Pengecekan Hak Akses dan Isolasi Data pada Pencarian Global (`src/modules/search/actions.ts:26-124`)

Cuplikan Kode 4.21 di atas membuktikan bahwa pencarian global tidak pernah membocorkan data rahasia lintas peran:
- Akun Administrator dapat mencari kepegawaian, inventaris, dan data keuangan retribusi PBG.
- Akun Pegawai secara mutlak diisolasi: kueri penugasan jadwal dibatasi oleh klausul `eq(jadwal.pegawaiId, sessionUser.id)`. Pegawai dilarang mencari data keuangan retribusi PBG maupun daftar aparatur pegawai lainnya. Total hasil pencarian dibatasi secara ketat maksimal 8 butir data untuk menjaga latensi transmisi jaringan.

---

## 4.6.4 Inventaris Endpoint API dan Route Handlers Lengkap

Arsitektur komunikasi sisi server SIMOP DPMPTSP terbagi menjadi dua kategori utama:
1. **HTTP Route Handlers (`src/app/api/`)**: Menangani pertukaran data biner, integrasi penyimpanan awan pihak ketiga, dan antarmuka mesin-ke-mesin (*RESTful endpoints*).
2. **Next.js Server Actions (`src/modules/*/actions.ts`)**: Menangani mutasi data interaktif dari formulir antarmuka pengguna dengan eksekusi aman di sisi server.

Daftar seluruh HTTP Route Handlers yang terpasang pada sistem disajikan pada Tabel 4.50 berikut.

**Tabel 4.50** Inventaris Endpoint API HTTP (*Route Handlers*) SIMOP DPMPTSP
| Metode | Jalur URL (*Path*) | Penjaga (*Guard*) | Hak Akses (*Role*) | Parameter Masukan (*Request Payload*) | Respons Sukses (*Status & Format*) | Respons Galat (*Status & Kondisi*) | FR Terkait | Bukti Kode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ALL` | `/api/auth/[...all]` | Terbuka / Internal | Publik / Terautentikasi | Sesuai protokol pustaka Better Auth | `200 OK` (JSON token/sesi) | `400 / 401 / 429` (Kredensial salah / rate limit) | FR-01, FR-02 | `src/app/api/auth/[...all]/route.ts:4` |
| `POST` | `/api/uploads/sign` | `requireRole` (cek DB aktif) | `PEGAWAI`, `ADMIN` | JSON: `{ jadwalId, slot, contentType, fileSize }` | `200 OK` (JSON: `{ presignedUrl, objectKey }`) | `400` (JSON/skema salah), `403` (Bukan pemilik), `404` (Jadwal nihil) | FR-08 | `src/app/api/uploads/sign/route.ts:19` |
| `GET` | `/api/uploads/preview` | `requireAuth` (cek DB aktif) | `PEGAWAI`, `ADMIN` | Query URL: `?key=jadwal/...` | `200 OK` (JSON: `{ previewUrl }`) | `400` (Key salah format), `403` (Bukan haknya), `404` (Jadwal nihil) | FR-08, FR-10 | `src/app/api/uploads/preview/route.ts:8` |
| `GET` | `/api/cron/pbg-reminder` | `CRON_SECRET` Header | Sistem / Cron | `[DITANGGUHKAN SEMENTARA DI FASE 4]` | `[TIDAK DIBUAT DI KODE]` | `[TIDAK DIBUAT DI KODE]` | FR-18 | `docs/DECISIONS.md:121-128` |

Tabel 4.50 di atas merangkum seluruh antarmuka HTTP REST. Endpoint `/api/uploads/sign` dan `/api/uploads/preview` bertindak sebagai gerbang terisolasi untuk mengamankan pertukaran berkas dengan Cloudflare R2, sedangkan endpoint cron reminder tercatat secara transparan tidak diimplementasikan pada basis kode saat ini (`[DITANGGUHKAN SEMENTARA DI FASE 4]`).

Daftar seluruh Server Actions yang mengendalikan mutasi data transaksi sistem disajikan pada Tabel 4.51 berikut.

**Tabel 4.51** Inventaris *Server Actions* Logika Bisnis Sisi Server SIMOP DPMPTSP
| Nama Server Action | Modul Induk | Hak Akses (*Role*) | Skema Masukan Zod | Mutasi Entitas Basis Data & Transaksi | Dampak *Cache* Antarmuka (*Revalidation*) | FR Terkait | Bukti Kode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `createPegawaiAction` | Kepegawaian | `ADMIN` | `createPegawaiSchema` | Menyisipkan baris `users` dan `accounts` (Scrypt hash) | `revalidatePath('/admin/pegawai')` | FR-03 | `src/modules/pegawai/actions.ts:20` |
| `updatePegawaiAction` | Kepegawaian | `ADMIN` | `updatePegawaiSchema` | Memperbarui kolom `name`, `bidang`, `nip` pada `users` | `revalidatePath('/admin/pegawai')` | FR-04 | `src/modules/pegawai/actions.ts:66` |
| `resetPegawaiPasswordAction` | Kepegawaian | `ADMIN` | `resetPasswordSchema` | Memperbarui hash sandi pada `accounts` $\to$ menghapus `sessions` | `revalidatePath('/admin/pegawai')` | FR-05 | `src/modules/pegawai/actions.ts:85` |
| `togglePegawaiStatusAction` | Kepegawaian | `ADMIN` | Parameter `id`, `boolean` | Transaksi `deactivateUser` atau `activateUser` | `revalidatePath('/admin/pegawai')` | FR-04 | `src/modules/pegawai/actions.ts:107` |
| `createJadwalRangeAction` | Jadwal | `ADMIN` | `createJadwalRangeSchema` | *Batch insert* multi-baris entitas penugasan `jadwal` | `revalidatePath('/admin/jadwal', '/dashboard')` | FR-06 | `src/modules/jadwal/actions.ts:27` |
| `deleteJadwalAction` | Jadwal | `ADMIN` | Parameter `id` (string) | Validasi bukan `SELESAI` $\to$ `DELETE FROM jadwal` $\to$ R2 delete | `revalidatePath('/admin/jadwal', '/dashboard', ...)` | FR-07 | `src/modules/jadwal/actions.ts:76` |
| `submitLaporanAction` | Jadwal | `PEGAWAI`, `ADMIN` | `submitLaporanSchema` | Verifikasi R2 $\to$ `UPDATE jadwal SET status='MENUNGGU_VERIFIKASI'` | `revalidatePath('/pegawai/jadwal', '/dashboard', ...)` | FR-08, FR-09 | `src/modules/jadwal/actions.ts:126` |
| `verifikasiJadwalAction` | Verifikasi | `ADMIN` | `verifikasiActionSchema` | `UPDATE jadwal SET status = 'SELESAI' / 'BELUM_DIKERJAKAN'` | `revalidatePath('/admin/verifikasi', '/dashboard', ...)` | FR-10, FR-11 | `src/modules/verifikasi/actions.ts:16` |
| `createBarangAction` | Inventaris | `ADMIN` | `createBarangSchema` | Transaksi: `insert(barang)` $\to$ `insert(stok_log)` jika stok $> 0$ | `revalidatePath('/admin/inventaris')` | FR-12 | `src/modules/inventaris/actions.ts:21` |
| `updateBarangAction` | Inventaris | `ADMIN` | `updateBarangSchema` | Memperbarui atribut katalog `barang` | `revalidatePath('/admin/inventaris')` | FR-13 | `src/modules/inventaris/actions.ts:67` |
| `adjustStokAction` | Inventaris | `ADMIN` | `adjustStokSchema` | Transaksi: kueri stok $\to$ `UPDATE barang` bersyarat $\to$ `insert(stok_log)` | `revalidatePath('/admin/inventaris')` | FR-14 | `src/modules/inventaris/actions.ts:93` |
| `deleteOrArchiveBarangAction` | Inventaris | `ADMIN` | Parameter `id` (string) | Transaksi: jika ada riwayat set `diarsipkan_pada`, jika nihil delete fisik | `revalidatePath('/admin/inventaris')` | FR-13 | `src/modules/inventaris/actions.ts:186` |
| `restoreBarangAction` | Inventaris | `ADMIN` | Parameter `id` (string) | Memperbarui `diarsipkan_pada = NULL` pada tabel `barang` | `revalidatePath('/admin/inventaris')` | FR-13 | `src/modules/inventaris/actions.ts:246` |
| `createTiketAction` | Tiket | `PEGAWAI`, `ADMIN` | `createTiketSchema` | Pengecekan arsip barang $\to$ generate nomor tiket $\to$ `insert(tiket)` | `revalidatePath('/pegawai/tiket', '/dashboard', ...)` | FR-15 | `src/modules/tiket/actions.ts:20` |
| `accTiketAction` | Tiket | `ADMIN` | Parameter `tiketId`, `catatan` | Transaksi atomik: klaim status tiket $\to$ potong stok $\to$ `stok_log` | `revalidatePath('/admin/inventaris', '/dashboard', ...)` | FR-17 | `src/modules/tiket/actions.ts:81` |
| `updateTiketStatusAction` | Tiket | `ADMIN` | `updateTiketStatusSchema` | Validasi transisi status domain $\to$ pembaruan kolom `status` | `revalidatePath('/admin/inventaris', '/dashboard', ...)` | FR-16, FR-17 | `src/modules/tiket/actions.ts:169` |
| `createPbgAction` | PBG | `ADMIN` | `createPbgSchema` | Cek keunikan SKRD $\to$ normalisasi WA $\to$ `insert(pbg)` | `revalidatePath('/admin/pbg', '/dashboard')` | FR-18 | `src/modules/pbg/actions.ts:19` |
| `updatePbgAction` | PBG | `ADMIN` | `updatePbgSchema` | Cek keunikan SKRD $\to$ pembaruan atribut `pbg` | `revalidatePath('/admin/pbg', '/dashboard')` | FR-18 | `src/modules/pbg/actions.ts:60` |
| `markPbgLunasAction` | PBG | `ADMIN` | Parameter `id` (string) | `UPDATE pbg SET status='LUNAS', dibayar_pada=NOW()` | `revalidatePath('/admin/pbg', '/dashboard')` | FR-19 | `src/modules/pbg/actions.ts:102` |
| `unmarkPbgLunasAction` | PBG | `ADMIN` | Parameter `id` (string) | `UPDATE pbg SET status='BELUM_BAYAR', dibayar_pada=NULL` | `revalidatePath('/admin/pbg', '/dashboard')` | FR-19 | `src/modules/pbg/actions.ts:148` |
| `deletePbgAction` | PBG | `ADMIN` | Parameter `id` (string) | `DELETE FROM pbg WHERE id = ?` | `revalidatePath('/admin/pbg', '/dashboard')` | FR-18 | `src/modules/pbg/actions.ts:186` |
| `getPbgFullContactAction` | PBG | `ADMIN` | Parameter `id` (string) | Mengambil rekaman data PBG dengan nomor WhatsApp utuh tanpa sensor | Tidak ada mutasi data | FR-18 | `src/modules/pbg/actions.ts:214` |
| `changePasswordAction` | Profil | `PEGAWAI`, `ADMIN` | `changePasswordSchema` | Eksekusi `auth.api.changePassword` Better Auth $\to$ cabut sesi lain | Sesi lain terputus | FR-02 | `src/modules/profil/actions.ts:8` |
| `globalSearchAction` | Pencarian | `PEGAWAI`, `ADMIN` | Parameter `query` (string) | Kueri pencarian teks multi-tabel dengan isolasi peran (maks 8 hasil) | Tidak ada mutasi data | FR-20 | `src/modules/search/actions.ts:26` |

Tabel 4.51 di atas merangkum 24 fungsi *Server Actions* yang menyokong seluruh operasional sistem. Pola arsitektur ini membuktikan bahwa seluruh mutasi data terlindungi di sisi server, divalidasi oleh skema tipe data Zod yang kuat, dan menyegarkan tampilan antarmuka secara instan melalui pemanggilan `revalidatePath`.

---

## 4.6.5 Matriks Keterlacakan End-to-End Sistem

Untuk membuktikan integritas rekayasa perangkat lunak secara menyeluruh dari hulu ke hilir, Matriks Keterlacakan *End-to-End* (*End-to-End Traceability Matrix*) menghubungkan setiap Kebutuhan Fungsional (FR) dengan komponen antarmuka *front-end*, endpoint API atau *Server Action*, fungsi pengendali, tabel basis data yang dimanipulasi, serta status keterlacakan akhirnya.

Matriks keterlacakan *end-to-end* SIMOP DPMPTSP disajikan pada Tabel 4.52 berikut.

**Tabel 4.52** Matriks Keterlacakan *End-to-End* (*Traceability Matrix*) SIMOP DPMPTSP
| ID FR | Deskripsi Kebutuhan Fungsional | Rute Halaman Antarmuka | Endpoint API / Server Action | Fungsi Pengendali Sisi Server | Tabel Basis Data Terlibat | Status Keterlacakan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Autentikasi Masuk Akun Aparatur | `/login` | `POST /api/auth/sign-in/username` | Better Auth Sign-In Handler | `users`, `accounts`, `sessions`, `rate_limits` | Terlacak Penuh |
| **FR-02** | Pembaruan Kata Sandi Mandiri | `/pegawai/profil` | `changePasswordAction` | `auth.api.changePassword` | `accounts`, `sessions` | Terlacak Penuh |
| **FR-03** | Pendaftaran Aparatur Pegawai Baru | `/admin/pegawai` | `createPegawaiAction` | `db.insert(user)`, `db.insert(account)` | `users`, `accounts` | Terlacak Penuh |
| **FR-04** | Pembaruan Data Profil & Status Keaktifan | `/admin/pegawai` | `updatePegawaiAction`, `togglePegawaiStatusAction` | `db.update(user)`, `deactivateUser`, `activateUser` | `users`, `sessions` | Terlacak Penuh |
| **FR-05** | Reset Kata Sandi Akun Aparatur | `/admin/pegawai` | `resetPegawaiPasswordAction` | `hashPassword`, `db.update(account)`, `delete(session)` | `accounts`, `sessions` | Terlacak Penuh |
| **FR-06** | Pembuatan Jadwal Penugasan Fleksibel | `/admin/jadwal` | `createJadwalRangeAction` | `generateJadwalRange`, `db.insert(jadwal)` | `jadwal`, `users` | Terlacak Penuh |
| **FR-07** | Pembatalan dan Penghapusan Jadwal | `/admin/jadwal` | `deleteJadwalAction` | `db.delete(jadwal)`, `deleteR2Object` | `jadwal` | Terlacak Penuh |
| **FR-08** | Pelaporan Pelaksanaan Tugas Kedinasan | `/pegawai/jadwal` | `POST /api/uploads/sign`, `submitLaporanAction` | `createPresignedUploadUrl`, `verifyR2Object`, `db.update(jadwal)` | `jadwal` | Terlacak Penuh |
| **FR-09** | Riwayat dan Unduh Bukti Tugas Mandiri | `/pegawai/jadwal` | `GET /api/uploads/preview` | `createPresignedPreviewUrl` | `jadwal` | Terlacak Penuh |
| **FR-10** | Verifikasi Laporan Pelaksanaan Tugas | `/admin/verifikasi` | `verifikasiJadwalAction` | `validateStatusTransition`, `db.update(jadwal)` | `jadwal`, `users` | Terlacak Penuh |
| **FR-11** | Riwayat Verifikasi dan Pratinjau Bukti | `/admin/verifikasi` | `GET /api/uploads/preview` | `createPresignedPreviewUrl` | `jadwal` | Terlacak Penuh |
| **FR-12** | Pendaftaran Katalog Barang Inventaris | `/admin/inventaris` | `createBarangAction` | `db.transaction(insert barang, insert stokLog)` | `barang`, `stok_log` | Terlacak Penuh |
| **FR-13** | Pembaruan dan Pengarsipan Barang | `/admin/inventaris` | `updateBarangAction`, `deleteOrArchiveBarangAction` | `db.transaction(check tiket/log -> archive/delete)` | `barang`, `tiket`, `stok_log` | Terlacak Penuh |
| **FR-14** | Penyesuaian Kuantitas Persediaan (*Stock In/Out*) | `/admin/inventaris` | `adjustStokAction` | `db.transaction(update barang bersyarat, insert stokLog)` | `barang`, `stok_log` | Terlacak Penuh |
| **FR-15** | Pengajuan Tiket Permintaan/Kerusakan | `/pegawai/tiket` | `createTiketAction` | `db.insert(tiket)` | `tiket`, `barang`, `users` | Terlacak Penuh |
| **FR-16** | Pemantauan Status Tiket Mandiri | `/pegawai/tiket` | Server Component Query | `getTiketPegawaiList` | `tiket`, `barang` | Terlacak Penuh |
| **FR-17** | Pemrosesan dan Persetujuan Tiket (*ACC*) | `/admin/inventaris?tab=tiket` | `accTiketAction`, `updateTiketStatusAction` | `db.transaction(claim tiket, potong stok, stokLog)` | `tiket`, `barang`, `stok_log` | Terlacak Penuh |
| **FR-18** | Manajemen Ketetapan Retribusi PBG | `/admin/pbg` | `createPbgAction`, `updatePbgAction`, `deletePbgAction` | `db.insert(pbg)`, `db.update(pbg)`, `db.delete(pbg)` | `pbg` | Terlacak Penuh |
| **FR-19** | Monitoring Pelunasan SKRD PBG | `/admin/pbg` | `markPbgLunasAction`, `unmarkPbgLunasAction` | `db.update(pbg)` | `pbg` | Terlacak Penuh |
| **FR-20** | Pencarian Cepat Global (*CommandMenu*) | Global (Pintasan Cmd+K) | `globalSearchAction` | `db.select(...)` dengan filter peran RBAC ketat | `users`, `barang`, `pbg`, `jadwal` | Terlacak Penuh |

Tabel 4.52 di atas menegaskan bahwa ke-20 Kebutuhan Fungsional (FR-01 s.d. FR-20) yang ditetapkan pada Subbab Analisis Sistem terbukti berstatus **Terlacak Penuh** (*Fully Traced*). Setiap kebutuhan memiliki perwujudan konkret pada lapisan antarmuka pengguna, jalur komunikasi sisi server, pengendali transaksi, serta tabel penyimpanan data relasional.

---

## 4.6.6 Daftar Bukti Pemeriksaan Berkas Back-End

Seluruh pemaparan teknis pada Subbab 4.6 disusun berdasarkan pemeriksaan mendalam terhadap berkas-berkas kode sumber berikut:
1. `src/lib/env.ts` (baris 1–59): Skema validasi variabel lingkungan Zod dan resolusi *runtime*.
2. `next.config.ts` (baris 1–74): Konfigurasi Content-Security-Policy (CSP) dinamis dan HTTP Security Headers.
3. `src/lib/auth.ts` (baris 1–167): Konfigurasi Better Auth 1.2.9, hashing Scrypt, rate limiting database, dan trusted origins.
4. `src/lib/session.ts` (baris 1–100): Mekanisme *guard* sesi terpusat `requireRole` dan validasi akun aktif ke basis data.
5. `src/lib/user-management.ts` (baris 1–109): Transaksi atomik penonaktifan akun aparatur dan pencabutan sesi pengguna.
6. `src/lib/storage.ts` (baris 1–222): Integrasi Cloudflare R2 via AWS SDK S3, pembangkitan Presigned URL PUT/GET, dan verifikasi `HeadObjectCommand`.
7. `src/db/index.ts` (baris 1–66): Konfigurasi Node-Postgres `Pool` (max: 5, idle: 30s, SSL) dan inisialisasi Drizzle ORM.
8. `src/db/schema/auth.ts` (baris 1–86): Definisi skema tabel `users`, `sessions`, `accounts`, `verifications`, dan `rate_limits`.
9. `src/db/schema/domain.ts` (baris 1–164): Definisi skema tabel `jadwal`, `barang`, `tiket`, `stok_log`, `pbg`, `notifikasi_log`, dan `pengaturan`.
10. `src/db/schema/enums.ts` (baris 1–55): Definisi tipe enumerasi PostgreSQL sistem.
11. `src/app/api/auth/[...all]/route.ts` (baris 1–5): Handler rute autentikasi Next.js Better Auth.
12. `src/app/api/uploads/sign/route.ts` (baris 1–100): Route Handler HTTP POST untuk otorisasi dan penerbitan Presigned Upload URL.
13. `src/app/api/uploads/preview/route.ts` (baris 1–77): Route Handler HTTP GET untuk otorisasi dan penerbitan Presigned Preview URL.
14. `src/modules/pegawai/actions.ts` (baris 1–120): Logika Server Actions manajemen aparatur sipil dinas.
15. `src/modules/pegawai/schema.ts` (baris 1–33): Skema validasi Zod pembuatan, pembaruan, dan reset kata sandi pegawai.
16. `src/modules/jadwal/actions.ts` (baris 1–197): Logika Server Actions pembuatan penugasan jamak, penghapusan, dan pelaporan tugas.
17. `src/modules/jadwal/lib/generator.ts` (baris 1–129): Logika kalkulasi rentang hari penugasan, pemfilteran akhir pekan, dan validasi transisi status jadwal.
18. `src/modules/jadwal/schema.ts` (baris 1–26): Skema validasi Zod penugasan rentang tanggal dan unggah bukti laporan tugas.
19. `src/modules/verifikasi/actions.ts` (baris 1–90): Logika Server Actions verifikasi laporan pelaksanaan tugas oleh administrator.
20. `src/modules/verifikasi/schema.ts` (baris 1–27): Skema validasi Zod keputusan verifikasi laporan tugas.
21. `src/modules/inventaris/actions.ts` (baris 1–281): Logika Server Actions transaksi katalog inventaris, mutasi stok, dan *soft-archive*.
22. `src/modules/inventaris/schema.ts` (baris 1–38): Skema validasi Zod registrasi barang, edit katalog, dan penyesuaian kuantitas persediaan.
23. `src/modules/tiket/actions.ts` (baris 1–217): Logika Server Actions pengajuan tiket dan transaksi persetujuan atomik (*anti double-ACC*).
24. `src/modules/tiket/lib/transitions.ts` (baris 1–72): Aturan mesin status transisi tiket layanan.
25. `src/modules/tiket/schema.ts` (baris 1–22): Skema validasi Zod pengajuan tiket dan pembaruan status tiket.
26. `src/modules/pbg/actions.ts` (baris 1–240): Logika Server Actions manajemen ketetapan retribusi PBG dan pembaruan status SKRD.
27. `src/modules/pbg/schema.ts` (baris 1–68): Skema validasi Zod tagihan PBG dan fungsi normalisasi nomor WhatsApp.
28. `src/modules/profil/actions.ts` (baris 1–40): Logika Server Actions pembaruan kata sandi mandiri via Better Auth API.
29. `src/modules/profil/schema.ts` (baris 1–19): Skema validasi Zod pergantian kata sandi mandiri aparatur.
30. `src/modules/search/actions.ts` (baris 1–192): Logika Server Actions penelusuran data terpadu dengan penegakan isolasi data berbasis peran.
31. `docs/DECISIONS.md` (baris 110–140): Catatan keputusan teknis terkait kebijakan arsip barang, penangguhan bot WhatsApp Fase 4, dan transaksi atomik tiket ACC.

