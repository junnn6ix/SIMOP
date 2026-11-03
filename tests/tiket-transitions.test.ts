import { describe, it, expect } from 'vitest';
import { validateTiketTransition } from '@/modules/tiket/lib/transitions';

describe('validateTiketTransition - Pure Domain Status Transition Rules', () => {
  it('allows valid transitions from MENUNGGU', () => {
    expect(() => validateTiketTransition('MENUNGGU', 'ACC')).not.toThrow();
    expect(() => validateTiketTransition('MENUNGGU', 'DITOLAK')).not.toThrow();
    expect(() => validateTiketTransition('MENUNGGU', 'MAINTENANCE', 'LAPOR_KERUSAKAN')).not.toThrow();
  });

  it('rejects MAINTENANCE for PERMINTAAN_BARANG', () => {
    expect(() =>
      validateTiketTransition('MENUNGGU', 'MAINTENANCE', 'PERMINTAAN_BARANG')
    ).toThrow('Status MAINTENANCE hanya berlaku untuk tiket jenis LAPOR_KERUSAKAN');
  });

  it('allows valid transitions from ACC and MAINTENANCE to SELESAI', () => {
    expect(() => validateTiketTransition('ACC', 'SELESAI')).not.toThrow();
    expect(() => validateTiketTransition('MAINTENANCE', 'SELESAI')).not.toThrow();
    expect(() => validateTiketTransition('ACC', 'MAINTENANCE', 'LAPOR_KERUSAKAN')).not.toThrow();
  });

  it('rejects illegal transitions directly to SELESAI from MENUNGGU', () => {
    expect(() => validateTiketTransition('MENUNGGU', 'SELESAI')).toThrow(
      'Tiket berstatus MENUNGGU hanya dapat dialihkan ke ACC, DITOLAK, atau MAINTENANCE'
    );
  });

  it('rejects any transitions from final statuses (SELESAI or DITOLAK)', () => {
    expect(() => validateTiketTransition('SELESAI', 'MENUNGGU')).toThrow(
      'Tiket dengan status akhir SELESAI bersifat permanen'
    );
    expect(() => validateTiketTransition('DITOLAK', 'MENUNGGU')).toThrow(
      'Tiket dengan status akhir DITOLAK bersifat permanen'
    );
    expect(() => validateTiketTransition('SELESAI', 'ACC')).toThrow(
      'Tiket dengan status akhir SELESAI bersifat permanen'
    );
  });

  it('rejects transition to the identical status', () => {
    expect(() => validateTiketTransition('ACC', 'ACC')).toThrow('Tiket sudah berada pada status ACC');
    expect(() => validateTiketTransition('MENUNGGU', 'MENUNGGU')).toThrow('Tiket sudah berada pada status MENUNGGU');
  });
});

