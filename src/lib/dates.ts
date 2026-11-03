/**
 * Utility pengelolaan tanggal & waktu SIMOP DPMPTSP Kabupaten Karawang
 * Standar zona waktu: Asia/Jakarta (WIB, UTC+7)
 * Bahasa: Bahasa Indonesia (id-ID)
 */

export const TIMEZONE = 'Asia/Jakarta';
export const LOCALE = 'id-ID';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

/**
 * Mengembalikan objek Date saat ini dalam representasi WIB
 */
export function nowWib(): Date {
  return new Date();
}

/**
 * Format tanggal standar: "3 November 2026"
 */
export function formatDate(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format tanggal ringkas: "3 Nov 2026"
 */
export function formatDateShort(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format tanggal lengkap beserta hari: "Selasa, 3 November 2026"
 */
export function formatDateWithDay(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format tanggal dan jam: "3 November 2026, 13:00 WIB"
 */
export function formatDateTime(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  const dateStr = formatDate(d);
  const timeStr = formatTime(d);
  return `${dateStr}, ${timeStr}`;
}

/**
 * Format jam: "13:00 WIB"
 */
export function formatTime(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  const timeFormatted = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${timeFormatted.replace('.', ':')} WIB`;
}

/**
 * Format string tanggal YYYY-MM-DD sesuai zona waktu WIB
 */
export function toWibDateString(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d); // Returns 'YYYY-MM-DD'
}

/**
 * Format waktu relatif manusiawi: "baru saja", "5 menit yang lalu", "kemarin", dsb.
 */
export function formatRelative(date: Date | string | number): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'baru saja';
  }
  if (diffMin < 60) {
    return `${diffMin} menit yang lalu`;
  }
  if (diffHour < 24) {
    return `${diffHour} jam yang lalu`;
  }
  if (diffDay === 1) {
    return 'kemarin';
  }
  if (diffDay < 7) {
    return `${diffDay} hari yang lalu`;
  }
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} minggu yang lalu`;
  }
  return formatDate(d);
}

/**
 * Memeriksa apakah tanggal jatuh tempo berada dalam rentang H-N (default 3 hari ke depan)
 */
export function isDueSoon(targetDate: Date | string | number, days: number = 3): boolean {
  const target = toDate(targetDate);
  if (isNaN(target.getTime())) return false;

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= days;
}

/**
 * Memeriksa apakah tanggal sudah terlewat (kadaluarsa)
 */
export function isOverdue(targetDate: Date | string | number): boolean {
  const target = toDate(targetDate);
  if (isNaN(target.getTime())) return false;

  return target.getTime() < Date.now();
}

export { MONTH_NAMES_ID, DAY_NAMES_ID };

