import { db } from '@/db';
import { notifikasiLog, pbg } from '@/db/schema/domain';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { toWibDateString, formatDate } from '@/lib/dates';
import { maskWaNumber } from '@/modules/pbg/queries';
import { resolveWaSender, type WaSender } from '@/lib/wa';
import { getPengaturan } from './pengaturan';
import {
  renderWaReminderTemplate,
  DEFAULT_WA_TEMPLATE_REMINDER,
  KEY_WA_TEMPLATE_REMINDER,
} from './template';

export { renderWaReminderTemplate };

export interface PbgReminderTarget {
  id: string;
  pemohon: string;
  noWa: string;
  noSkrd: string;
  nominal: string;
  jatuhTempo: string;
  status: 'BELUM_BAYAR' | 'LUNAS';
}

export interface RunPbgReminderOptions {
  trigger: 'CRON' | 'MANUAL';
  pbgIds?: string[];
  referenceDate?: Date | string;
  waSender?: WaSender;
}

export interface ReminderSummary {
  total: number;
  terkirim: number;
  gagal: number;
  dryRun: number;
  dilewati: number;
}


/**
 * Mengambil target tagihan PBG untuk pengingat H-3 dalam rentang hari ini s.d. +3 hari WIB.
 * Khusus pemicu CRON: mengecualikan tagihan yang sudah memiliki notifikasi_log pada snapshot tanggal yang sama.
 */
export async function getReminderTargets(
  options: {
    trigger: 'CRON' | 'MANUAL';
    pbgIds?: string[];
    referenceDate?: Date | string;
  },
  customDb = db
): Promise<PbgReminderTarget[]> {
  // Jika target eksplisit diberikan via ID (misal dari tombol aksi per baris di tabel PBG)
  if (options.pbgIds && options.pbgIds.length > 0) {
    const records = await customDb
      .select({
        id: pbg.id,
        pemohon: pbg.pemohon,
        noWa: pbg.noWa,
        noSkrd: pbg.noSkrd,
        nominal: pbg.nominal,
        jatuhTempo: pbg.jatuhTempo,
        status: pbg.status,
      })
      .from(pbg)
      .where(inArray(pbg.id, options.pbgIds))
      .limit(50);

    return records;
  }

  const todayWibStr = options.referenceDate
    ? toWibDateString(options.referenceDate)
    : toWibDateString(new Date());

  const parts = todayWibStr.split('-').map(Number);
  const endRef = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 3));
  const endWibStr = endRef.toISOString().slice(0, 10);

  if (options.trigger === 'CRON') {
    // Mode otomatis CRON: tagihan BELUM_BAYAR, jatuh tempo H s.d. H+3, dan BELUM pernah dikirimi log notifikasi H-3
    const targets = await customDb
      .select({
        id: pbg.id,
        pemohon: pbg.pemohon,
        noWa: pbg.noWa,
        noSkrd: pbg.noSkrd,
        nominal: pbg.nominal,
        jatuhTempo: pbg.jatuhTempo,
        status: pbg.status,
      })
      .from(pbg)
      .where(
        and(
          eq(pbg.status, 'BELUM_BAYAR'),
          sql`${pbg.jatuhTempo} >= ${todayWibStr}::date`,
          sql`${pbg.jatuhTempo} <= ${endWibStr}::date`,
          sql`NOT EXISTS (
            SELECT 1 FROM ${notifikasiLog} nl
            WHERE nl.pbg_id = ${pbg.id}
              AND nl.jenis = 'PBG_JATUH_TEMPO_H_MIN_3'
              AND nl.jatuh_tempo_snapshot = (${pbg.jatuhTempo}::text || 'T00:00:00+07:00')::timestamptz
              AND (
                nl.status IN ('TERKIRIM', 'DRY_RUN')
                OR (nl.status = 'PENDING' AND nl.created_at >= NOW() - INTERVAL '10 minutes')
              )
          )`
        )
      )
      .orderBy(pbg.jatuhTempo)
      .limit(50);

    return targets;
  }

  // Mode MANUAL massal: tagihan BELUM_BAYAR dalam rentang H s.d. H+3
  const targets = await customDb
    .select({
      id: pbg.id,
      pemohon: pbg.pemohon,
      noWa: pbg.noWa,
      noSkrd: pbg.noSkrd,
      nominal: pbg.nominal,
      jatuhTempo: pbg.jatuhTempo,
      status: pbg.status,
    })
    .from(pbg)
    .where(
      and(
        eq(pbg.status, 'BELUM_BAYAR'),
        sql`${pbg.jatuhTempo} >= ${todayWibStr}::date`,
        sql`${pbg.jatuhTempo} <= ${endWibStr}::date`
      )
    )
    .orderBy(pbg.jatuhTempo)
    .limit(50);

  return targets;
}

/**
 * Orkestrasi pengiriman notifikasi pengingat retribusi PBG.
 * Dipakai bersama oleh Route Handler Cron dan Server Action Manual.
 */
export async function runPbgReminder(
  options: RunPbgReminderOptions,
  customDb = db
): Promise<ReminderSummary> {
  const targets = await getReminderTargets(options, customDb);

  const summary: ReminderSummary = {
    total: targets.length,
    terkirim: 0,
    gagal: 0,
    dryRun: 0,
    dilewati: 0,
  };

  if (targets.length === 0) {
    return summary;
  }

  const sender = options.waSender ?? (await resolveWaSender());
  const template = await getPengaturan(KEY_WA_TEMPLATE_REMINDER, DEFAULT_WA_TEMPLATE_REMINDER);

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const isCron = options.trigger === 'CRON';

    // Jenis notifikasi & snapshot penguncian
    const jenis = isCron ? ('PBG_JATUH_TEMPO_H_MIN_3' as const) : ('MANUAL' as const);
    // Untuk CRON, snapshot dikunci secara deterministik ke tanggal jatuh tempo PBG tepat pukul 00:00:00 WIB (UTC+7)
    // agar unique constraint (pbg_id, jenis, jatuh_tempo_snapshot) persis sama dan mencegah kirim ganda antar-eksekusi.
    // Untuk MANUAL, snapshot menggunakan timestamp saat tombol ditekan agar tidak memblokir cron otomatis berikutnya.
    const jatuhTempoSnapshot = isCron
      ? new Date(`${item.jatuhTempo.slice(0, 10)}T00:00:00+07:00`)
      : new Date();

    const pesan = renderWaReminderTemplate(template, {
      pemohon: item.pemohon,
      nominal: item.nominal,
      jatuhTempo: item.jatuhTempo,
      noSkrd: item.noSkrd,
    });

    const maskedWa = maskWaNumber(item.noWa);

    // Batasi pengiriman manual: maksimal 1 pesan MANUAL per PBG per jam
    if (!isCron) {
      const [recentManual] = await customDb
        .select({ id: notifikasiLog.id })
        .from(notifikasiLog)
        .where(
          and(
            eq(notifikasiLog.pbgId, item.id),
            eq(notifikasiLog.jenis, 'MANUAL'),
            sql`${notifikasiLog.createdAt} >= NOW() - INTERVAL '1 hour'`
          )
        )
        .limit(1);

      if (recentManual) {
        summary.dilewati++;
        continue;
      }
    }

    // Langkah 1: Sisipkan baris notifikasi_log DULU dengan status 'PENDING'
    // Gunakan ON CONFLICT DO NOTHING pada constraint unique (pbg_id, jenis, jatuh_tempo_snapshot)
    let logId: string | null = null;

    try {
      const [inserted] = await customDb
        .insert(notifikasiLog)
        .values({
          id: crypto.randomUUID(),
          pbgId: item.id,
          jenis,
          jatuhTempoSnapshot,
          status: 'PENDING',
          pesan,
          waTujuan: maskedWa,
          respons: null,
          createdAt: new Date(),
        })
        .onConflictDoNothing({
          target: [
            notifikasiLog.pbgId,
            notifikasiLog.jenis,
            notifikasiLog.jatuhTempoSnapshot,
          ],
        })
        .returning({ id: notifikasiLog.id });

      if (!inserted) {
        // Terjadi konflik unik. Cek dan klaim ulang secara atomik jika baris berstatus PENDING menggantung (> 10 menit)
        const [reclaimed] = await customDb
          .update(notifikasiLog)
          .set({
            status: 'PENDING',
            createdAt: new Date(),
            pesan,
            waTujuan: maskedWa,
            respons: 'Mengklaim ulang baris PENDING menggantung (>10 menit)',
          })
          .where(
            and(
              eq(notifikasiLog.pbgId, item.id),
              eq(notifikasiLog.jenis, jenis),
              eq(notifikasiLog.jatuhTempoSnapshot, jatuhTempoSnapshot),
              eq(notifikasiLog.status, 'PENDING'),
              sql`${notifikasiLog.createdAt} < NOW() - INTERVAL '10 minutes'`
            )
          )
          .returning({ id: notifikasiLog.id });

        if (!reclaimed) {
          // Baris sudah terkirim, dry-run, atau sedang dikerjakan proses lain (< 10 menit)
          summary.dilewati++;
          continue;
        }

        logId = reclaimed.id;
      } else {
        logId = inserted.id;
      }
    } catch (insertErr) {
      // Jika terjadi kesalahan database pada saat insert, lewati item ini demi stabilitas batch
      summary.dilewati++;
      continue;
    }

    // Langkah 2: Kirim lewat WaSender
    try {
      const sendResult = await sender.send(item.noWa, pesan);

      let finalStatus: 'TERKIRIM' | 'GAGAL' | 'DRY_RUN' = 'GAGAL';

      if (sendResult.raw?.includes('DRY_RUN')) {
        finalStatus = 'DRY_RUN';
        summary.dryRun++;
      } else if (sendResult.ok) {
        finalStatus = 'TERKIRIM';
        summary.terkirim++;
      } else {
        finalStatus = 'GAGAL';
        summary.gagal++;
      }

      const maskedRawResponse = sendResult.raw
        ? sendResult.raw.slice(0, 500)
        : sendResult.error
          ? `Error: ${sendResult.error.slice(0, 400)}`
          : 'Pesan selesai diproses';

      await customDb
        .update(notifikasiLog)
        .set({
          status: finalStatus,
          respons: maskedRawResponse,
        })
        .where(eq(notifikasiLog.id, logId));
    } catch (sendErr: unknown) {
      summary.gagal++;
      const errMsg =
        sendErr instanceof Error
          ? sendErr.message
          : 'Kegagalan tidak terduga saat pengiriman pesan';

      await customDb
        .update(notifikasiLog)
        .set({
          status: 'GAGAL',
          respons: `Exception: ${errMsg.slice(0, 400)}`,
        })
        .where(eq(notifikasiLog.id, logId));
    }

    // Beri jeda 1.2 detik antar pengiriman jika ada lebih dari 1 item untuk mencegah rate-limit
    if (targets.length > 1 && i < targets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  return summary;
}

