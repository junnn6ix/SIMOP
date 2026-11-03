import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';
import { db } from '@/db';
import { jadwal } from '@/db/schema/domain';
import { createPresignedPreviewUrl } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth({ checkDbActive: true });

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Parameter key wajib dicantumkan.' },
        { status: 400 }
      );
    }

    const match = key.match(/^jadwal\/([^/]+)\//);
    if (!match) {
      return NextResponse.json(
        { error: 'Format kunci berkas tidak valid.' },
        { status: 400 }
      );
    }

    const jadwalId = match[1];

    // Ambil data jadwal untuk otorisasi akses
    const [targetJadwal] = await db
      .select({
        id: jadwal.id,
        pegawaiId: jadwal.pegawaiId,
        buktiKey: jadwal.buktiKey,
        pdfKey: jadwal.pdfKey,
      })
      .from(jadwal)
      .where(eq(jadwal.id, jadwalId))
      .limit(1);

    if (!targetJadwal) {
      return NextResponse.json(
        { error: 'Jadwal terkait tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Hanya ADMIN atau Pegawai pemilik tugas yang boleh melihat berkas
    if (user.role !== 'ADMIN' && targetJadwal.pegawaiId !== user.id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak untuk melihat berkas ini.' },
        { status: 403 }
      );
    }

    // Keamanan ketat: Hanya kunci yang benar-benar tercatat pada jadwal (buktiKey / pdfKey)
    // yang diizinkan untuk dibuatkan signed preview URL
    if (key !== targetJadwal.buktiKey && key !== targetJadwal.pdfKey) {
      return NextResponse.json(
        { error: 'Kunci berkas tidak tercatat resmi pada jadwal tugas ini.' },
        { status: 403 }
      );
    }

    const previewUrl = await createPresignedPreviewUrl(key, 300);

    return NextResponse.json({ previewUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memproses pratinjau berkas.' },
      { status: 500 }
    );
  }
}
