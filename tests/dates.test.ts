import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateWithDay,
  formatDateTime,
  formatTime,
  toWibDateString,
  formatRelative,
  isDueSoon,
  isOverdue,
  getWibCurrentWeekRange,
  TIMEZONE,
  LOCALE,
} from '@/lib/dates';

describe('dates utility', () => {
  it('exports correct timezone and locale', () => {
    expect(TIMEZONE).toBe('Asia/Jakarta');
    expect(LOCALE).toBe('id-ID');
  });

  it('formats dates in Indonesian', () => {
    // 2026-11-03T10:00:00Z -> in WIB (UTC+7) is 2026-11-03 17:00
    const d = new Date('2026-11-03T10:00:00.000Z');
    expect(formatDate(d)).toContain('November');
    expect(formatDate(d)).toContain('2026');
    expect(formatDateWithDay(d)).toContain('Selasa');
    expect(formatDateTime(d)).toContain('17:00 WIB');
    expect(formatTime(d)).toBe('17:00 WIB');
    expect(toWibDateString(d)).toBe('2026-11-03');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate('invalid-date')).toBe('-');
    expect(formatDateTime('invalid-date')).toBe('-');
    expect(formatTime('invalid-date')).toBe('-');
    expect(toWibDateString('invalid-date')).toBe('');
    expect(formatRelative('invalid-date')).toBe('-');
    expect(isDueSoon('invalid-date')).toBe(false);
    expect(isOverdue('invalid-date')).toBe(false);
  });

  it('calculates relative time correctly', () => {
    const now = Date.now();
    expect(formatRelative(new Date(now - 10 * 1000))).toBe('baru saja');
    expect(formatRelative(new Date(now - 5 * 60 * 1000))).toBe('5 menit yang lalu');
    expect(formatRelative(new Date(now - 2 * 3600 * 1000))).toBe('2 jam yang lalu');
    expect(formatRelative(new Date(now - 26 * 3600 * 1000))).toBe('kemarin');
  });

  it('checks due soon and overdue status', () => {
    const now = Date.now();
    const futureH2 = new Date(now + 2 * 24 * 3600 * 1000);
    const futureH10 = new Date(now + 10 * 24 * 3600 * 1000);
    const pastH1 = new Date(now - 1 * 24 * 3600 * 1000);

    expect(isDueSoon(futureH2, 3)).toBe(true);
    expect(isDueSoon(futureH10, 3)).toBe(false);
    expect(isOverdue(pastH1)).toBe(true);
    expect(isOverdue(futureH2)).toBe(false);
  });

  it('generates exact Monday-to-Sunday week range in WIB', () => {
    // 2026-11-04 is Wednesday
    const wednesday = new Date('2026-11-04T12:00:00+07:00');
    const week = getWibCurrentWeekRange(wednesday);
    expect(week.mondayDateStr).toBe('2026-11-02');
    expect(week.sundayDateStr).toBe('2026-11-08');

    // 2026-11-08 is Sunday
    const sunday = new Date('2026-11-08T20:00:00+07:00');
    const weekSun = getWibCurrentWeekRange(sunday);
    expect(weekSun.mondayDateStr).toBe('2026-11-02');
    expect(weekSun.sundayDateStr).toBe('2026-11-08');

    // 2026-11-02 is Monday
    const monday = new Date('2026-11-02T08:00:00+07:00');
    const weekMon = getWibCurrentWeekRange(monday);
    expect(weekMon.mondayDateStr).toBe('2026-11-02');
    expect(weekMon.sundayDateStr).toBe('2026-11-08');
  });
});
