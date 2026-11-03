import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { createPresignedUploadUrl, MAX_UPLOAD_SIZE } from '@/lib/storage';

const signSchema = z.object({
  jadwalId: z.string().min(1, 'ID Jadwal wajib diisi'),
  slot: z.enum(['foto', 'pdf']),
  contentType: z.string().min(1, 'Tipe konten wajib diisi'),
  fileSize: z
    .number()
    .min(1, 'Ukuran berkas tidak boleh kosong')
    .max(MAX_UPLOAD_SIZE, 'Ukuran berkas maksimal 5 MB'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi aktif ke database (bukan hanya cache cookie)
    const { user } = await requireRole(['PEGAWAI', 'ADMIN'], { checkDbActive: true });

    // 2. Baca body dengan perlindungan parsing JSON
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Format JSON pada request tidak valid.' },
        { status: 400 }
      );
    }

    // 3. Validasi skema input
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Input tidak valid' },
        { status: 400 }
      );
    }

    const { jadwalId, slot, contentType } = parsed.data;

    // 4. Verifikasi kepemilikan jadwal dan status penugasan
    const [targetJadwal] = await db
      .select({
        id: jadwal.id,
        pegawaiId: jadwal.pegawaiId,
        status: jadwal.status,
      })
      .from(jadwal)
      .where(eq(jadwal.id, jadwalId))
      .limit(1);

    if (!targetJadwal) {
      return NextResponse.json(
        { error: 'Jadwal tugas tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && targetJadwal.pegawaiId !== user.id) {
      return NextResponse.json(
        { error: 'Anda hanya dapat mengunggah bukti untuk tugas Anda sendiri.' },
        { status: 403 }
      );
    }

    if (targetJadwal.status !== 'BELUM_DIKERJAKAN') {
      return NextResponse.json(
        {
          error:
            'Pengunggahan berkas hanya dapat dilakukan untuk jadwal berstatus BELUM_DIKERJAKAN.',
        },
        { status: 400 }
      );
    }

    const result = await createPresignedUploadUrl({
      jadwalId,
      slot,
      contentType,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || 'Validasi skema gagal.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat memproses izin unggah.' },
      { status: 500 }
    );
  }
}
