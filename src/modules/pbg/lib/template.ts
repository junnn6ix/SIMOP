import { formatDate } from '@/lib/dates';

export const KEY_WA_BOT_AKTIF = 'wa_bot_aktif';
export const KEY_WA_TEMPLATE_REMINDER = 'wa_template_reminder';

export const DEFAULT_WA_TEMPLATE_REMINDER = `Yth. Bapak/Ibu {pemohon},

Kami dari DPMPTSP Kabupaten Karawang menginformasikan bahwa kewajiban retribusi PBG Anda dengan No. SKRD {no_skrd} sebesar {nominal} akan jatuh tempo pada {jatuh_tempo}.

Mohon segera melakukan pembayaran dan konfirmasi melalui loket pelayanan atau sistem SIMOP DPMPTSP.

Abaikan pesan ini jika Anda telah menyelesaikan pembayaran.
Terima kasih.
DPMPTSP Kabupaten Karawang`;

/**
 * Render template pesan pengingat WA dengan substitusi placeholder:
 * - {pemohon} -> Nama pemohon PBG
 * - {nominal} -> Nominal retribusi format Rupiah (e.g. Rp 15.000.000)
 * - {jatuh_tempo} -> Tanggal jatuh tempo format Indonesia (e.g. 15 November 2026)
 * - {no_skrd} -> Nomor SKRD
 * Placeholder tak dikenal dibiarkan utuh.
 * Fungsi murni (pure) tanpa dependensi database sehingga aman diimpor pada Client Component.
 */
export function renderWaReminderTemplate(
  template: string,
  data: {
    pemohon: string;
    nominal: number | string;
    jatuhTempo: Date | string;
    noSkrd: string;
  }
): string {
  const tpl = template?.trim() ? template : DEFAULT_WA_TEMPLATE_REMINDER;

  const num =
    typeof data.nominal === 'number'
      ? data.nominal
      : parseFloat(data.nominal || '0');

  const nominalRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);

  const jatuhTempoFormatted = formatDate(data.jatuhTempo);

  return tpl
    .replaceAll('{pemohon}', data.pemohon)
    .replaceAll('{nominal}', nominalRupiah)
    .replaceAll('{jatuh_tempo}', jatuhTempoFormatted)
    .replaceAll('{no_skrd}', data.noSkrd);
}

