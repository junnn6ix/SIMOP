import { desc, eq, and, or, ilike, sql } from 'drizzle-orm';
import { db } from '@/db';
import { pbg, notifikasiLog } from '@/db/schema/domain';
import { toWibDateString } from '@/lib/dates';

export interface PbgFilterParams {
  status?: string;
  search?: string;
  referenceDate?: Date | string;
}

/**
 * Menyensor (mask) nomor WhatsApp seluler pemohon:
 * Contoh: '6281234567890' -> '62812****7890'
 */
export function maskWaNumber(val: string): string {
  if (!val || val.length < 8) return val;
  return val.slice(0, 5) + '****' + val.slice(-4);
}

export async function getPbgList(filters: PbgFilterParams = {}) {
  const conditions = [];

  const todayWibStr = filters.referenceDate
    ? toWibDateString(filters.referenceDate)
    : toWibDateString(new Date());

  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'JATUH_TEMPO_3_HARI') {
      const parts = todayWibStr.split('-').map(Number);
      const endDate = new Date(parts[0], parts[1] - 1, parts[2] + 3);
      const endWibStr = toWibDateString(endDate);

      conditions.push(
        and(
          eq(pbg.status, 'BELUM_BAYAR'),
          sql`${pbg.jatuhTempo} >= ${todayWibStr}::date`,
          sql`${pbg.jatuhTempo} <= ${endWibStr}::date`
        )
      );
    } else {
      conditions.push(eq(pbg.status, filters.status as any));
    }
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(pbg.pemohon, term),
        ilike(pbg.noSkrd, term),
        ilike(pbg.lokasi, term),
        ilike(pbg.noWa, term)
      )
    );
  }

  const items = await db
    .select({
      id: pbg.id,
      pemohon: pbg.pemohon,
      noWa: pbg.noWa,
      noSkrd: pbg.noSkrd,
      lokasi: pbg.lokasi,
      nominal: pbg.nominal,
      jatuhTempo: pbg.jatuhTempo,
      status: pbg.status,
      dibayarPada: pbg.dibayarPada,
      createdAt: pbg.createdAt,
      updatedAt: pbg.updatedAt,
      lastNotifikasiAt: sql<Date | null>`(SELECT MAX(created_at) FROM ${notifikasiLog} WHERE ${notifikasiLog.pbgId} = ${pbg.id})`,
      notifikasiCount: sql<number>`(SELECT COUNT(*)::int FROM ${notifikasiLog} WHERE ${notifikasiLog.pbgId} = ${pbg.id})`,
    })
    .from(pbg)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pbg.createdAt));

  // Masking nomor WA di server sebelum dikirim ke klien
  return items.map((item) => ({
    ...item,
    noWa: maskWaNumber(item.noWa),
  }));
}

/**
 * Mengambil daftar tagihan PBG yang berstatus BELUM_BAYAR dan jatuh tempo
 * antara hari ini s.d. +3 hari di zona waktu WIB (Asia/Jakarta) via SQL.
 * Parameter referenceDate memungkinkan penguncian hari acuan untuk pengujian deterministik.
 */
export async function getPbgDueSoon(referenceDate?: Date | string, customDb = db) {
  const todayWibStr = referenceDate
    ? toWibDateString(referenceDate)
    : toWibDateString(new Date());

  const parts = todayWibStr.split('-').map(Number);
  // Hitung batas akhir H+3 secara aman dalam representasi tanggal kalender UTC
  const endRef = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 3));
  const endWibStr = endRef.toISOString().slice(0, 10);

  const items = await customDb
    .select({
      id: pbg.id,
      pemohon: pbg.pemohon,
      noWa: pbg.noWa,
      noSkrd: pbg.noSkrd,
      lokasi: pbg.lokasi,
      nominal: pbg.nominal,
      jatuhTempo: pbg.jatuhTempo,
      status: pbg.status,
      dibayarPada: pbg.dibayarPada,
    })
    .from(pbg)
    .where(
      and(
        eq(pbg.status, 'BELUM_BAYAR'),
        sql`${pbg.jatuhTempo} >= ${todayWibStr}::date`,
        sql`${pbg.jatuhTempo} <= ${endWibStr}::date`
      )
    )
    .orderBy(pbg.jatuhTempo);

  return items;
}

export async function getPbgById(id: string) {
  const [item] = await db
    .select()
    .from(pbg)
    .where(eq(pbg.id, id))
    .limit(1);

  return item || null;
}

export interface NotifikasiLogItem {
  id: string;
  pbgId: string;
  pemohon: string;
  noSkrd: string;
  jenis: string;
  jatuhTempoSnapshot: Date;
  status: 'TERKIRIM' | 'GAGAL' | 'DRY_RUN' | 'PENDING';
  pesan: string;
  waTujuan: string;
  respons: string | null;
  createdAt: Date;
}

export async function getNotifikasiLogs(filters: { status?: string; search?: string } = {}) {
  const conditions = [];

  if (filters.status && filters.status !== 'ALL') {
    conditions.push(eq(notifikasiLog.status, filters.status as any));
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(pbg.pemohon, term),
        ilike(pbg.noSkrd, term),
        ilike(notifikasiLog.waTujuan, term)
      )
    );
  }

  const rows = await db
    .select({
      id: notifikasiLog.id,
      pbgId: notifikasiLog.pbgId,
      pemohon: pbg.pemohon,
      noSkrd: pbg.noSkrd,
      jenis: notifikasiLog.jenis,
      jatuhTempoSnapshot: notifikasiLog.jatuhTempoSnapshot,
      status: notifikasiLog.status,
      pesan: notifikasiLog.pesan,
      waTujuan: notifikasiLog.waTujuan,
      respons: notifikasiLog.respons,
      createdAt: notifikasiLog.createdAt,
    })
    .from(notifikasiLog)
    .innerJoin(pbg, eq(notifikasiLog.pbgId, pbg.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notifikasiLog.createdAt))
    .limit(100);

  return rows as NotifikasiLogItem[];
}
