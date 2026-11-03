import { describe, it, expect } from 'vitest';
import {
  createPresignedUploadUrl,
  verifyR2Object,
  getExtensionFromMime,
  ALLOWED_FOTO_MIMES,
  ALLOWED_PDF_MIMES,
} from '@/lib/storage';
import { verifikasiActionSchema } from '@/modules/verifikasi/schema';
import { submitLaporanSchema, createJadwalRangeSchema } from '@/modules/jadwal/schema';

describe('Cloudflare R2 Storage Security & Key Generation', () => {
  it('generates server-controlled object keys with proper prefix: jadwal/{jadwalId}/{uuid}.{ext}', async () => {
    const jadwalId = 'task-uuid-12345';
    const result = await createPresignedUploadUrl({
      jadwalId,
      slot: 'foto',
      contentType: 'image/jpeg',
    });

    expect(result.objectKey).toMatch(/^jadwal\/task-uuid-12345\/[a-f0-9-]+\.jpg$/);
    expect(result.presignedUrl).toBeDefined();
    expect(typeof result.presignedUrl).toBe('string');
  });

  it('correctly maps file extensions based on content type', () => {
    expect(getExtensionFromMime('image/jpeg')).toBe('jpg');
    expect(getExtensionFromMime('image/png')).toBe('png');
    expect(getExtensionFromMime('image/webp')).toBe('webp');
    expect(getExtensionFromMime('application/pdf')).toBe('pdf');
  });

  it('rejects unsupported MIME types for foto and pdf slots', async () => {
    await expect(
      createPresignedUploadUrl({
        jadwalId: 'task-1',
        slot: 'foto',
        contentType: 'application/pdf',
      })
    ).rejects.toThrow('Format foto harus berupa JPEG, PNG, atau WebP.');

    await expect(
      createPresignedUploadUrl({
        jadwalId: 'task-1',
        slot: 'pdf',
        contentType: 'image/png',
      })
    ).rejects.toThrow('Format berkas harus berupa dokumen PDF.');
  });

  it('verifies R2 object key prefix matches the target task identity', async () => {
    // Valid key prefix
    const valid = await verifyR2Object({
      objectKey: 'jadwal/target-jadwal-1/foto-uuid.jpg',
      jadwalId: 'target-jadwal-1',
      allowedMimes: ALLOWED_FOTO_MIMES,
    });
    expect(valid.contentType).toBeDefined();

    // Mismatched key prefix
    await expect(
      verifyR2Object({
        objectKey: 'jadwal/different-jadwal/foto-uuid.jpg',
        jadwalId: 'target-jadwal-1',
        allowedMimes: ALLOWED_FOTO_MIMES,
      })
    ).rejects.toThrow('Kunci objek tidak sesuai dengan identitas jadwal tugas.');
  });
});

describe('Verifikasi Schema Rules', () => {
  it('allows ACC decision without notes', () => {
    const parsed = verifikasiActionSchema.safeParse({
      jadwalId: 'jadwal-123',
      decision: 'ACC',
    });
    expect(parsed.success).toBe(true);
  });

  it('allows ACC decision with optional positive notes', () => {
    const parsed = verifikasiActionSchema.safeParse({
      jadwalId: 'jadwal-123',
      decision: 'ACC',
      catatanVerifikator: 'Pelaksanaan tugas sangat baik dan lengkap.',
    });
    expect(parsed.success).toBe(true);
  });

  it('strictly rejects TOLAK decision if catatanVerifikator is missing or too short', () => {
    const noNotes = verifikasiActionSchema.safeParse({
      jadwalId: 'jadwal-123',
      decision: 'TOLAK',
    });
    expect(noNotes.success).toBe(false);
    if (!noNotes.success) {
      expect(noNotes.error.issues[0]?.message).toContain('Catatan alasan penolakan wajib diisi');
    }

    const shortNotes = verifikasiActionSchema.safeParse({
      jadwalId: 'jadwal-123',
      decision: 'TOLAK',
      catatanVerifikator: 'Bad',
    });
    expect(shortNotes.success).toBe(false);
  });

  it('accepts TOLAK decision when valid explanation is provided', () => {
    const validRejection = verifikasiActionSchema.safeParse({
      jadwalId: 'jadwal-123',
      decision: 'TOLAK',
      catatanVerifikator: 'Foto bukti lapangan buram, tolong unggah ulang foto yang jelas.',
    });
    expect(validRejection.success).toBe(true);
  });
});

describe('Jadwal Pelaporan Schema Rules', () => {
  it('requires buktiKey and validates submitLaporanSchema', () => {
    const missingPhoto = submitLaporanSchema.safeParse({
      jadwalId: 'j-1',
    });
    expect(missingPhoto.success).toBe(false);

    const valid = submitLaporanSchema.safeParse({
      jadwalId: 'j-1',
      buktiKey: 'jadwal/j-1/evidence.jpg',
      pdfKey: 'jadwal/j-1/doc.pdf',
      laporanTeks: 'Telah selesai dinas luar.',
    });
    expect(valid.success).toBe(true);
  });
});

