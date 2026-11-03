import { hashPassword } from 'better-auth/crypto';
import { db, pool } from './index';
import { user, account } from './schema/auth';
import { barang, pengaturan } from './schema/domain';
import { getSyntheticEmail } from '../lib/auth';

export async function seed() {
  // Proteksi lingkungan produksi
  if (
    process.env.NODE_ENV === 'production' &&
    !process.argv.includes('--force-production')
  ) {
    console.error(
      '❌ Seeder dibatalkan: Menjalankan seeder pada lingkungan production memerlukan flag eksplisit --force-production.'
    );
    process.exit(1);
  }

  console.log('🌱 Memulai proses seeding database SIMOP DPMPTSP...');

  // Resolusi password aman (env atau random generator)
  let adminPassword = process.env.SEED_ADMIN_PASSWORD;
  let adminPasswordGenerated = false;
  if (!adminPassword) {
    adminPassword = `Adm!${crypto.randomUUID().slice(0, 10)}`;
    adminPasswordGenerated = true;
  }

  let pegawaiPassword = process.env.SEED_PEGAWAI_PASSWORD;
  let pegawaiPasswordGenerated = false;
  if (!pegawaiPassword) {
    pegawaiPassword = `Peg!${crypto.randomUUID().slice(0, 10)}`;
    pegawaiPasswordGenerated = true;
  }

  if (adminPasswordGenerated) {
    console.log(`🔑 Password Acak Admin (username: admin)        : ${adminPassword}`);
  }
  if (pegawaiPasswordGenerated) {
    console.log(`🔑 Password Acak Pegawai (pegawai_ptsp & pegawai_pm): ${pegawaiPassword}`);
  }
  if (!adminPasswordGenerated && !pegawaiPasswordGenerated) {
    console.log('🔑 Menggunakan password dari environment variable (SEED_ADMIN_PASSWORD & SEED_PEGAWAI_PASSWORD).');
  }

  // 1. Seed Akun Pengguna dengan Bidang yang Valid di bidangEnum
  const initialUsers = [
    {
      name: 'Administrator SIMOP',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN' as const,
      bidang: 'SEKRETARIAT' as const,
      nip: '198001012005011001',
    },
    {
      name: 'Budi Santoso',
      username: 'pegawai_ptsp',
      password: pegawaiPassword,
      role: 'PEGAWAI' as const,
      bidang: 'PTSP' as const,
      nip: '198805122010011002',
    },
    {
      name: 'Siti Rahayu',
      username: 'pegawai_pm',
      password: pegawaiPassword,
      role: 'PEGAWAI' as const,
      bidang: 'PM' as const,
      nip: '199203152015022001',
    },
  ];

  for (const u of initialUsers) {
    const email = getSyntheticEmail(u.username);
    const existingUser = await db.query.user.findFirst({
      where: (tbl, { eq }) => eq(tbl.username, u.username),
    });

    let userId: string;

    if (!existingUser) {
      userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        name: u.name,
        email,
        emailVerified: true,
        username: u.username,
        displayUsername: u.username,
        role: u.role,
        bidang: u.bidang,
        nip: u.nip,
        aktif: true,
        banned: false,
      });

      const hashedPassword = await hashPassword(u.password);
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
      });

      console.log(`  ✓ Akun dibuat: ${u.username} (${u.role} - Bidang: ${u.bidang})`);
    } else {
      userId = existingUser.id;
      console.log(`  - Akun sudah ada: ${u.username} (Bidang: ${existingUser.bidang})`);
    }
  }

  // 2. Seed Barang Inventaris (ATK & Aset)
  const initialBarang = [
    {
      kodeBarang: 'BRG-ATK-001',
      nama: 'Kertas HVS A4 80gsm',
      kategori: 'ATK' as const,
      stok: 50,
      satuan: 'Rim',
      deskripsi: 'Kertas cetak dokumen laporan dan surat dinas pelayanan',
    },
    {
      kodeBarang: 'BRG-ATK-002',
      nama: 'Tinta Printer Epson 003 Hitam',
      kategori: 'ATK' as const,
      stok: 12,
      satuan: 'Botol',
      deskripsi: 'Tinta printer operasional loket perizinan',
    },
    {
      kodeBarang: 'BRG-AST-001',
      nama: 'PC Desktop All-in-One Loket 1',
      kategori: 'ASET' as const,
      stok: 1,
      satuan: 'Unit',
      deskripsi: 'Komputer operasional loket pendaftaran perizinan',
    },
    {
      kodeBarang: 'BRG-AST-002',
      nama: 'Meja Kerja Pegawai Ergonomis',
      kategori: 'ASET' as const,
      stok: 4,
      satuan: 'Unit',
      deskripsi: 'Meja kerja standar operasional staf bidang perizinan',
    },
  ];

  for (const b of initialBarang) {
    const existing = await db.query.barang.findFirst({
      where: (tbl, { eq }) => eq(tbl.kodeBarang, b.kodeBarang),
    });

    if (!existing) {
      await db.insert(barang).values({
        id: crypto.randomUUID(),
        ...b,
      });
      console.log(`  ✓ Barang dibuat: ${b.kodeBarang} - ${b.nama}`);
    } else {
      console.log(`  - Barang sudah ada: ${b.kodeBarang}`);
    }
  }

  // 3. Seed Pengaturan Sistem (Key-Value dengan wa_bot_aktif default 'false')
  const initialPengaturan = [
    {
      key: 'wa_bot_aktif',
      value: 'false',
    },
    {
      key: 'wa_template_reminder',
      value:
        'Yth. Bapak/Ibu {pemohon},\n\nKami dari DPMPTSP Kabupaten Karawang menginformasikan bahwa kewajiban retribusi PBG Anda dengan No. SKRD {no_skrd} sebesar Rp {nominal} akan jatuh tempo pada {jatuh_tempo}.\n\nMohon segera melakukan pembayaran dan konfirmasi melalui loket pelayanan atau sistem SIMOP DPMPTSP.\n\nTerima kasih.',
    },
    {
      key: 'admin_contact',
      value: '08123456789',
    },
  ];

  for (const p of initialPengaturan) {
    const existing = await db.query.pengaturan.findFirst({
      where: (tbl, { eq }) => eq(tbl.key, p.key),
    });

    if (!existing) {
      await db.insert(pengaturan).values({
        key: p.key,
        value: p.value,
      });
      console.log(`  ✓ Pengaturan dibuat: ${p.key}`);
    } else {
      console.log(`  - Pengaturan sudah ada: ${p.key}`);
    }
  }

  console.log('✅ Seeding database SIMOP DPMPTSP selesai dengan sukses.');
}

if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('❌ Gagal menjalankan seeder:', err);
      process.exit(1);
    });
}
