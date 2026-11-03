# SIMOP DPMPTSP
**Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang**

Aplikasi web internal modern untuk penjadwalan tugas pegawai, verifikasi laporan lapangan, manajemen inventaris (ATK/aset) & tiket permohonan/kerusakan, serta monitoring retribusi Persetujuan Bangunan Gedung (PBG).

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + shadcn/ui primitives di-skin penuh mengikuti `docs/DESIGN.md` (Genesis)
- **Icons & Primitives**: Lucide React, Radix UI, TanStack Table, Sonner Toast, cmdk (Command Menu)
- **Database & ORM**: PostgreSQL (Neon) + Drizzle ORM (pooled connection untuk interactive transactions)
- **Autentikasi**: Better Auth (Username + Admin plugins, database rate limiting, disabled public registration)
- **Storage**: Cloudflare R2 (S3-compatible, presigned PUT/GET URLs)
- **WhatsApp**: Abstraksi `WaSender` (Fonnte provider + ConsoleWaSender untuk dev/test)
- **Testing**: Vitest (domain logic & security policies) + Playwright (smoke e2e)

---

## 🔒 Keamanan & Origin Terpercaya (`trustedOrigins`)
Better Auth dikonfigurasi secara ketat tanpa wildcard domain global (`*.vercel.app` dinonaktifkan). Domain yang diizinkan dibaca secara eksplisit dari environment variable:
- `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL`: URL utama aplikasi (misal `https://simop.karawangkab.go.id` atau `http://localhost:3000`).
- `VERCEL_PROJECT_PRODUCTION_URL`: URL deployment produksi otomatis Vercel.
- `SIMOP_PREVIEW_DOMAIN`: Pola domain branch preview spesifik proyek SIMOP (misal `simop-dpmptsp-*.vercel.app`).

---

## 🚀 Memulai (Local Development)

### 1. Prasyarat
- Node.js >= 20
- pnpm >= 9

### 2. Instalasi Dependensi
```bash
pnpm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai `DATABASE_URL` dengan connection string Neon PostgreSQL Anda.

### 4. Database Migrations & Seeding
```bash
# Menjalankan migrasi Drizzle ke PostgreSQL
pnpm db:migrate

# Menjalankan seeder awal (Admin, Pegawai, Inventaris, Pengaturan)
pnpm db:seed
```
*Catatan Seeder:*
- Pada environment development, password akun di-generate secara acak dan dicetak ke konsol bila `SEED_ADMIN_PASSWORD` dan `SEED_PEGAWAI_PASSWORD` tidak diset di `.env.local`.
- Seeder dilindungi dari eksekusi tidak sengaja di production; memerlukan flag eksplisit `--force-production`.

### 5. Menjalankan Server Pengembangan
```bash
pnpm dev
```
Buka browser di `http://localhost:3000`.

### 6. Galeri Komponen (Design System)
Buka `http://localhost:3000/dev/ui` untuk melihat seluruh katalog komponen UI, layout, dan shared yang diimplementasikan sesuai Genesis Design System.

---

## 🧪 Validasi & Pengujian
```bash
# Validasi tipe data TypeScript
pnpm typecheck

# Linter kode
pnpm lint

# Unit & security policies testing (Vitest)
pnpm test

# Verifikasi kepatuhan token warna (tanpa hex di luar globals.css)
pnpm check:tokens

# Build produksi
pnpm build
```

---

## 📁 Struktur Direktori
```
src/
├── app/                  # Next.js App Router (Halaman & API)
│   ├── (auth)/login/     # Login dengan AuthLayout & DotGrid
│   ├── (app)/            # Halaman terlindungi (AppShell terpusat di layout.tsx)
│   │   └── dashboard/    # Dashboard ringkas per role
│   ├── dev/ui/           # Galeri komponen interaktif (dev only)
│   └── api/              # Route handlers (auth, uploads, cron)
├── components/
│   ├── ui/               # Primitif shadcn ter-skin (Button, Input, dll)
│   ├── layout/           # AppShell, TopNav, PageContainer, dll
│   └── shared/           # Card, DataTable, StatusBadge, dll
├── modules/              # Fitur domain (schema, queries, actions, components)
├── config/               # Navigasi per role & metadata
├── db/                   # Drizzle schema, client, & seed
├── lib/                  # Auth, env, storage, wa, utils
└── styles/               # globals.css (token CSS variables)
```
