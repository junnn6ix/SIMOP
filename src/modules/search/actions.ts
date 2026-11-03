'use server';

import { or, ilike, and, eq, isNull, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';
import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { barang, jadwal, pbg } from '@/db/schema/domain';
import { formatDateShort } from '@/lib/dates';

export interface SearchResultItem {
  id: string;
  category: 'Pegawai' | 'Inventaris & ATK' | 'Jadwal Tugas' | 'Retribusi PBG';
  title: string;
  subtitle: string;
  href: string;
  iconName: 'User' | 'Package' | 'Calendar' | 'ReceiptText';
}

/**
 * Server Action untuk Pencarian Global CommandMenu (Ctrl/Cmd+K)
 * Menegakkan otorisasi peran secara ketat:
 * - ADMIN: Dapat mencari pegawai, inventaris/barang, dan retribusi PBG.
 * - PEGAWAI: HANYA dapat mencari jadwal tugas milik sendiri dan katalog barang.
 * Membatasi hasil maksimal 8 item.
 */
export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  const { user: sessionUser } = await requireAuth();
  const q = query.trim();

  if (!q || q.length < 2) {
    return [];
  }

  const results: SearchResultItem[] = [];
  const term = `%${q}%`;

  if (sessionUser.role === 'ADMIN') {
    // 1. Cari Pegawai (maks 4)
    const employees = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        bidang: user.bidang,
        role: user.role,
      })
      .from(user)
      .where(
        and(
          eq(user.aktif, true),
          or(
            ilike(user.name, term),
            ilike(user.username, term),
            ilike(user.nip, term)
          )
        )
      )
      .limit(4);

    for (const emp of employees) {
      results.push({
        id: `user-${emp.id}`,
        category: 'Pegawai',
        title: emp.name,
        subtitle: `@${emp.username} \u2022 Bidang ${emp.bidang || 'Umum'} (${emp.role})`,
        href: '/admin/pegawai',
        iconName: 'User',
      });
    }

    // 2. Cari Inventaris & ATK (maks 4)
    const items = await db
      .select({
        id: barang.id,
        nama: barang.nama,
        kodeBarang: barang.kodeBarang,
        stok: barang.stok,
        satuan: barang.satuan,
      })
      .from(barang)
      .where(
        and(
          isNull(barang.diarsipkanPada),
          or(ilike(barang.nama, term), ilike(barang.kodeBarang, term))
        )
      )
      .limit(4);

    for (const itm of items) {
      results.push({
        id: `barang-${itm.id}`,
        category: 'Inventaris & ATK',
        title: itm.nama,
        subtitle: `Kode: ${itm.kodeBarang} \u2022 Stok: ${itm.stok} ${itm.satuan || 'Pcs'}`,
        href: '/admin/inventaris',
        iconName: 'Package',
      });
    }

    // 3. Jika belum mencapai 8 hasil, cari Retribusi PBG
    if (results.length < 8) {
      const remainingSlots = 8 - results.length;
      const pbgItems = await db
        .select({
          id: pbg.id,
          pemohon: pbg.pemohon,
          noSkrd: pbg.noSkrd,
          status: pbg.status,
        })
        .from(pbg)
        .where(or(ilike(pbg.pemohon, term), ilike(pbg.noSkrd, term)))
        .limit(remainingSlots);

      for (const p of pbgItems) {
        results.push({
          id: `pbg-${p.id}`,
          category: 'Retribusi PBG',
          title: p.pemohon,
          subtitle: `SKRD: ${p.noSkrd} \u2022 Status: ${p.status}`,
          href: '/admin/pbg',
          iconName: 'ReceiptText',
        });
      }
    }
  } else {
    // Role: PEGAWAI
    // 1. HANYA cari jadwal tugas milik sendiri
    const myJadwals = await db
      .select({
        id: jadwal.id,
        judul: jadwal.judul,
        status: jadwal.status,
        tanggal: jadwal.tanggal,
        lokasiTipe: jadwal.lokasiTipe,
      })
      .from(jadwal)
      .where(
        and(
          eq(jadwal.pegawaiId, sessionUser.id),
          or(ilike(jadwal.judul, term), ilike(jadwal.deskripsi, term))
        )
      )
      .orderBy(desc(jadwal.tanggal))
      .limit(5);

    for (const j of myJadwals) {
      results.push({
        id: `jadwal-${j.id}`,
        category: 'Jadwal Tugas',
        title: j.judul,
        subtitle: `${formatDateShort(j.tanggal)} \u2022 Lokasi: ${j.lokasiTipe} \u2022 ${j.status}`,
        href: '/pegawai/jadwal',
        iconName: 'Calendar',
      });
    }

    // 2. Cari katalog barang untuk pengajuan tiket (sisa slot maks 8)
    if (results.length < 8) {
      const remainingSlots = 8 - results.length;
      const items = await db
        .select({
          id: barang.id,
          nama: barang.nama,
          kodeBarang: barang.kodeBarang,
          stok: barang.stok,
          satuan: barang.satuan,
        })
        .from(barang)
        .where(
          and(
            isNull(barang.diarsipkanPada),
            or(ilike(barang.nama, term), ilike(barang.kodeBarang, term))
          )
        )
        .limit(remainingSlots);

      for (const itm of items) {
        results.push({
          id: `barang-${itm.id}`,
          category: 'Inventaris & ATK',
          title: itm.nama,
          subtitle: `Tersedia: ${itm.stok} ${itm.satuan || 'Pcs'} \u2022 Klik untuk ajukan tiket`,
          href: '/pegawai/tiket',
          iconName: 'Package',
        });
      }
    }
  }

  // Batasi secara ketat maksimal 8 item
  return results.slice(0, 8);
}
