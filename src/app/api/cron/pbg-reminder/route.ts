import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { runPbgReminder } from '@/modules/pbg/lib/reminder';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(cronSecret);

  if (tokenBuf.length !== secretBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized: Header Authorization Bearer CRON_SECRET tidak valid atau belum diatur.',
      },
      { status: 401 }
    );
  }

  try {
    const summary = await runPbgReminder({ trigger: 'CRON' });

    return NextResponse.json({
      ok: true,
      message: 'Pengingat retribusi PBG berhasil diproses.',
      summary: {
        total: summary.total,
        terkirim: summary.terkirim,
        gagal: summary.gagal,
        dryRun: summary.dryRun,
        dilewati: summary.dilewati,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menjalankan cron pengingat.';

    return NextResponse.json(
      {
        ok: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

